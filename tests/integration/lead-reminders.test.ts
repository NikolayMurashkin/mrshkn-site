import config from '@payload-config';
import { Cron } from 'croner';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { getPayload, ValidationError, type CollectionSlug, type Payload } from 'payload';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEAD_STAGE_LABELS } from '@/cms/consts';
import { SITE_URL } from '@/lib/consts';

/**
 * Напоминание «связаться» в карточке заявки: в срок бот студии пишет в чат заявок имя, этап, текст и ссылку
 * на карточку — одно сообщение на напоминание. Сроки проверяет задача очереди Payload по расписанию внутри
 * приложения. Тест запускает задачу так же, как расписание: ставит ее в очередь и прогоняет очередь. Payload
 * настоящий, Telegram — заглушка на случайном порту, адрес подменяется через env до вызова.
 */

const LEADS = 'leads' as CollectionSlug;

const JOBS = 'payload-jobs' as CollectionSlug;

const TASK = 'leadReminders';

const QUEUE = 'crm';

const TELEGRAM_CHAT = '100200';

const TELEGRAM_TOKEN = 'integration-token';

const ADMIN_LINK = '/admin/collections/leads';

const REMIND_TEXT_MAX = 500;

const STEP_LIMIT_MS = 15 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

type LeadDoc = {
  id: number | string;
  name: string;
  stage?: string | null;
  remindAt?: string | null;
  remindText?: string | null;
  remindSentAt?: string | null;
  notes?: { date?: string | null; text?: string | null }[] | null;
};

type TelegramCall = { chatId: string; text: string };

const telegram = {
  calls: [] as TelegramCall[],
  status: 200,
  /** Свой ответ на конкретное сообщение; нет — общий `status`. */
  respond: null as ((call: TelegramCall) => number) | null,
};

let payload: Payload;
let telegramServer: Server;
let sequence = 0;

const readBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const parseTelegram = (body: string): TelegramCall => {
  try {
    const json = JSON.parse(body) as { chat_id?: unknown; text?: unknown };

    return { chatId: String(json.chat_id), text: String(json.text) };
  } catch {
    const form = new URLSearchParams(body);

    return { chatId: String(form.get('chat_id')), text: String(form.get('text')) };
  }
};

const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ссылка на карточку именно этой записи: `/leads/1` не должен засчитываться за `/leads/12`. */
const cardLink = (id: LeadDoc['id']) => new RegExp(`${escapeRegExp(`${SITE_URL}${ADMIN_LINK}/${id}`)}(?![\\w-])`);

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000).toISOString();

const hasCollection = (slug: CollectionSlug) =>
  payload.config.collections.some((collection) => collection.slug === slug);

const expectReminderFields = () => {
  const leads = payload.config.collections.find((collection) => collection.slug === LEADS);

  expect(
    (leads?.flattenedFields ?? []).map((field) => field.name),
    'полей напоминания нет в коллекции leads',
  ).toEqual(expect.arrayContaining(['remindAt', 'remindText', 'remindSentAt']));
};

const reminderTask = () => (payload.config.jobs.tasks ?? []).find((task) => task.slug === TASK);

const expectReminderTask = () => {
  expect(
    (payload.config.jobs.tasks ?? []).map((task) => task.slug),
    'задачи leadReminders нет в config.jobs.tasks',
  ).toContain(TASK);
};

/**
 * Запуск, как его делает расписание: задача встает в очередь `crm`, очередь прогоняется. У задачи Payload нет своей
 * очереди по умолчанию — `jobs.queue` без `queue` положил бы ее в `default`, поэтому очередь указана явно.
 */
const runReminders = async () => {
  expectReminderTask();

  const job = (await payload.jobs.queue({ task: TASK, input: {}, queue: QUEUE } as never)) as { id: number | string };
  const result = await payload.jobs.run({ queue: QUEUE });

  return { jobId: job.id, status: result.jobStatus?.[String(job.id)]?.status };
};

/** Номер в имени с дефисом: «Клиент 3-й» не входит в «Клиент 31-й», сообщения разных заявок не путаются. */
const nextName = () => {
  sequence += 1;

  return `Клиент ${sequence}-й Ангелина`;
};

const seedLead = async (data: Partial<Omit<LeadDoc, 'id'>> = {}) => {
  expectReminderFields();

  return (await payload.create({
    collection: LEADS,
    data: { name: nextName(), contact: `+7 900 555-${String(sequence).padStart(2, '0')}-17`, ...data } as never,
    depth: 0,
    overrideAccess: true,
  })) as unknown as LeadDoc;
};

/** Заявка с напоминанием, срок которого прошел минуту назад. */
const seedDue = (data: Partial<Omit<LeadDoc, 'id'>> = {}) =>
  seedLead({ stage: 'qualified', remindAt: minutesFromNow(-1), remindText: 'Позвонить про КП', ...data });

const readLead = async (id: LeadDoc['id']) =>
  (await payload.findByID({ collection: LEADS, id, depth: 0, overrideAccess: true })) as unknown as LeadDoc;

const updateLead = async (id: LeadDoc['id'], data: Partial<Omit<LeadDoc, 'id'>>) =>
  (await payload.update({
    collection: LEADS,
    id,
    data: data as never,
    depth: 0,
    overrideAccess: true,
  })) as unknown as LeadDoc;

const callsWith = (lead: LeadDoc) => telegram.calls.filter((call) => call.text.includes(lead.name));

/** Шаги расписания на сутки вперед: за 12 ближайших запусков ночной провал рабочего cron не виден. */
const cronSteps = (expression: string) => {
  const cron = new Cron(expression, { paused: true, sloppyRanges: true });
  const start = new Date();
  const until = start.getTime() + DAY_MS;
  const steps: number[] = [];
  let previous = start;

  while (previous.getTime() <= until) {
    const next = cron.nextRun(previous);

    if (!next) {
      steps.push(Number.POSITIVE_INFINITY);
      break;
    }

    steps.push(next.getTime() - previous.getTime());
    previous = next;
  }

  cron.stop();

  return steps;
};

const expectStepWithinLimit = (expression: string, label: string) => {
  const longest = Math.max(...cronSteps(expression));

  expect(longest, `${label}: «${expression}» — самый длинный шаг за сутки, мс`).toBeLessThanOrEqual(STEP_LIMIT_MS);
};

beforeAll(async () => {
  payload = await getPayload({ config });

  telegramServer = createServer(async (request, response) => {
    const call = parseTelegram(await readBody(request));
    const status = telegram.respond?.(call) ?? telegram.status;

    telegram.calls.push(call);
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify(
        status === 200
          ? { ok: true, result: { message_id: telegram.calls.length } }
          : { ok: false, description: 'stub failure' },
      ),
    );
  });

  await new Promise<void>((resolve) => {
    telegramServer.listen(0, '127.0.0.1', () => resolve());
  });

  process.env.TELEGRAM_API_URL = `http://127.0.0.1:${(telegramServer.address() as AddressInfo).port}`;
  process.env.TELEGRAM_CHAT_IDS = TELEGRAM_CHAT;
});

afterAll(async () => {
  await new Promise((resolve) => telegramServer.close(resolve));
  await payload.destroy();
});

beforeEach(async () => {
  telegram.calls.length = 0;
  telegram.status = 200;
  telegram.respond = null;
  process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_TOKEN;
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await payload.delete({ collection: LEADS, where: { id: { exists: true } }, overrideAccess: true });

  if (hasCollection(JOBS)) {
    await payload.delete({ collection: JOBS, where: { id: { exists: true } }, overrideAccess: true });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('напоминание уходит в срок одним сообщением', () => {
  it('R1: напоминание минуту назад — одно сообщение с именем, этапом, текстом и ссылкой; запись отмечена', async () => {
    const lead = await seedDue();

    await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(1);

    const [message] = telegram.calls;

    expect(message.chatId, 'чат заявок студии').toBe(TELEGRAM_CHAT);
    expect(message.text).toContain(lead.name);
    expect(message.text).toContain(LEAD_STAGE_LABELS.qualified);
    expect(message.text).toContain('Позвонить про КП');
    expect(message.text, 'ссылка на карточку этой записи').toMatch(cardLink(lead.id));
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после отправки').toBe(false);
  });

  it('R2: повторный запуск после отправки — второго сообщения нет, отметка та же', async () => {
    const lead = await seedDue();

    await runReminders();

    const sentAt = (await readLead(lead.id)).remindSentAt;

    expect(isEmpty(sentAt), 'remindSentAt после первого запуска').toBe(false);

    await runReminders();

    expect(telegram.calls, 'сообщений после второго запуска').toHaveLength(1);
    expect((await readLead(lead.id)).remindSentAt, 'remindSentAt после второго запуска').toBe(sentAt);
  });

  it('R3: два напоминания в срок — один запуск шлет оба, каждое со ссылкой своей карточки', async () => {
    const first = await seedDue({ remindText: 'Позвонить первому' });
    const second = await seedDue({ remindText: 'Позвонить второму' });

    await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(2);

    for (const lead of [first, second]) {
      const messages = callsWith(lead);

      expect(messages, `сообщений с именем ${lead.name}`).toHaveLength(1);
      expect(messages[0].text, `ссылка на карточку ${lead.name}`).toMatch(cardLink(lead.id));
      expect(isEmpty((await readLead(lead.id)).remindSentAt), `remindSentAt у ${lead.name}`).toBe(false);
    }
  });

  it('R4: напоминание без текста — сообщение с именем, этапом и ссылкой; запись отмечена', async () => {
    const lead = await seedLead({ stage: 'contract', remindAt: minutesFromNow(-1) });

    await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(1);

    const [message] = telegram.calls;

    expect(message.text).toContain(lead.name);
    expect(message.text).toContain(LEAD_STAGE_LABELS.contract);
    expect(message.text, 'ссылка на карточку этой записи').toMatch(cardLink(lead.id));
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после отправки').toBe(false);
  });
});

describe('напоминание не в срок или не к месту не уходит', () => {
  it('F1: напоминание через час — сообщения нет, запись не отмечена', async () => {
    const lead = await seedDue({ remindAt: minutesFromNow(60) });

    await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(0);
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt у будущего напоминания').toBe(true);
  });

  it.each(['delivered', 'rejected'] as const)(
    'F2: заявка на этапе %s с напоминанием минуту назад — сообщения нет, запись не отмечена',
    async (stage) => {
      const lead = await seedDue({ stage });

      await runReminders();

      expect(telegram.calls, `сообщений бота на этапе ${stage}`).toHaveLength(0);
      expect(isEmpty((await readLead(lead.id)).remindSentAt), `remindSentAt на этапе ${stage}`).toBe(true);
    },
  );

  it.each(['new', 'proposal', 'contract', 'work'] as const)(
    'F3: заявка на этапе %s с напоминанием минуту назад — одно сообщение',
    async (stage) => {
      const lead = await seedDue({ stage });

      await runReminders();

      expect(telegram.calls, `сообщений бота на этапе ${stage}`).toHaveLength(1);
      expect(telegram.calls[0].text).toContain(lead.name);
      expect(telegram.calls[0].text).toContain(LEAD_STAGE_LABELS[stage]);
      expect(telegram.calls[0].text, 'ссылка на карточку этой записи').toMatch(cardLink(lead.id));
    },
  );

  it('N3: заявка без даты напоминания — сообщения нет, задача прошла без ошибки', async () => {
    const lead = await seedLead();

    expect(isEmpty(lead.remindAt), 'дата напоминания у обычной заявки').toBe(true);

    const { status } = await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(0);
    expect(status, 'итог прогона задачи').toBe('success');

    const failed = await payload.find({
      collection: JOBS,
      where: { hasError: { equals: true } },
      depth: 0,
      overrideAccess: true,
    });

    expect(failed.totalDocs, 'задач с ошибкой в payload-jobs').toBe(0);
  });
});

describe('новое напоминание — новая дата', () => {
  it('N1: после отправки дата и текст сменились — отметка снята, уходит второе сообщение с новым текстом', async () => {
    const lead = await seedDue();

    await runReminders();

    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после первой отправки').toBe(false);

    const updated = await updateLead(lead.id, { remindAt: minutesFromNow(-0.5), remindText: 'Второй звонок' });

    expect(isEmpty(updated.remindSentAt), 'remindSentAt сразу после смены даты').toBe(true);
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после перечитывания').toBe(true);

    await runReminders();

    expect(telegram.calls, 'сообщений бота за два напоминания').toHaveLength(2);
    expect(telegram.calls[1].text).toContain('Второй звонок');
    expect(telegram.calls[1].text, 'ссылка на карточку этой записи').toMatch(cardLink(lead.id));
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после второй отправки').toBe(false);
  });

  it('N2: после отправки сменились этап и заметки, дата та же — отметка цела, второго сообщения нет', async () => {
    const lead = await seedDue();

    await runReminders();

    const sent = await readLead(lead.id);

    expect(isEmpty(sent.remindSentAt), 'remindSentAt после отправки').toBe(false);

    // Админка сохраняет карточку целиком: дата напоминания приходит в правке той же.
    const updated = await updateLead(lead.id, {
      stage: 'proposal',
      remindAt: sent.remindAt,
      notes: [{ text: 'Созвонились, ждет КП' }],
    });

    expect(updated.remindSentAt, 'remindSentAt после правки без смены даты').toBe(sent.remindSentAt);

    await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(1);
  });

  it('N4: после отправки сменился только текст, дата та же — отметка цела, второго сообщения нет', async () => {
    const lead = await seedDue();

    await runReminders();

    const sent = await readLead(lead.id);

    expect(isEmpty(sent.remindSentAt), 'remindSentAt после отправки').toBe(false);

    const updated = await updateLead(lead.id, { remindAt: sent.remindAt, remindText: 'Уточнить бюджет' });

    expect(updated.remindSentAt, 'remindSentAt после смены одного текста').toBe(sent.remindSentAt);

    await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(1);
  });

  it('N5: после отправки правка без даты в данных (массовая смена этапа) — отметка цела, второго сообщения нет', async () => {
    const lead = await seedDue();

    await runReminders();

    const sent = await readLead(lead.id);

    expect(isEmpty(sent.remindSentAt), 'remindSentAt после отправки').toBe(false);

    // Массовая правка в списке админки присылает только выбранные поля: remindAt в данных нет.
    const updated = await updateLead(lead.id, { stage: 'proposal' });

    expect(updated.remindSentAt, 'remindSentAt после правки без remindAt').toBe(sent.remindSentAt);

    await runReminders();

    expect(telegram.calls, 'сообщений бота').toHaveLength(1);
  });
});

describe('сбой бота не теряет напоминание', () => {
  it('E1: бот ответил 500 — попытка была, запись не отмечена', async () => {
    const lead = await seedDue();

    telegram.status = 500;
    await runReminders();

    expect(telegram.calls, 'попыток до заглушки').toHaveLength(1);
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после ответа 500').toBe(true);
  });

  it('E2: после 500 бот снова отвечает — следующий запуск шлет то же сообщение и отмечает запись', async () => {
    const lead = await seedDue();

    telegram.status = 500;
    await runReminders();

    telegram.status = 200;
    await runReminders();

    expect(telegram.calls, 'попыток за два запуска').toHaveLength(2);
    expect(telegram.calls[1].text, 'повтор — то же сообщение').toBe(telegram.calls[0].text);
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после удачного повтора').toBe(false);
  });

  it('E3: 500 только на первой заявке — вторая уходит и отмечена, первая уходит следующим запуском', async () => {
    const first = await seedDue({ remindText: 'Позвонить первому' });
    const second = await seedDue({ remindText: 'Позвонить второму' });

    telegram.respond = (call) => (call.text.includes(first.name) ? 500 : 200);
    await runReminders();

    expect(callsWith(second), 'сообщений второй заявки').toHaveLength(1);
    expect(isEmpty((await readLead(second.id)).remindSentAt), 'remindSentAt второй заявки').toBe(false);
    expect(isEmpty((await readLead(first.id)).remindSentAt), 'remindSentAt первой заявки после 500').toBe(true);

    const before = telegram.calls.length;

    telegram.respond = null;
    await runReminders();

    const retried = telegram.calls.slice(before);

    expect(retried, 'сообщений во втором запуске').toHaveLength(1);
    expect(retried[0].text).toContain(first.name);
    expect(isEmpty((await readLead(first.id)).remindSentAt), 'remindSentAt первой заявки после повтора').toBe(false);
  });

  it('E4: Telegram не настроен — запись не отмечена; токен вернулся — напоминание уходит', async () => {
    const lead = await seedDue();

    process.env.TELEGRAM_BOT_TOKEN = '';
    await runReminders();

    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt без токена бота').toBe(true);

    process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_TOKEN;
    await runReminders();

    expect(telegram.calls, 'сообщений после возврата токена').toHaveLength(1);
    expect(telegram.calls[0].text).toContain(lead.name);
    expect(isEmpty((await readLead(lead.id)).remindSentAt), 'remindSentAt после возврата токена').toBe(false);
  });
});

describe('поля и расписание напоминаний', () => {
  it('V2: текст напоминания длиннее 500 знаков — ошибка валидации, запись не создана и не изменена; 500 — проходит', async () => {
    expectReminderFields();

    const tooLong = 'щ'.repeat(REMIND_TEXT_MAX + 1);
    const atLimit = 'ж'.repeat(REMIND_TEXT_MAX);
    const before = (await payload.count({ collection: LEADS, overrideAccess: true })).totalDocs;

    await expect(seedDue({ remindText: tooLong }), 'create с 501 знаком').rejects.toBeInstanceOf(ValidationError);
    expect((await payload.count({ collection: LEADS, overrideAccess: true })).totalDocs, 'записей после отказа').toBe(
      before,
    );

    const lead = await seedDue({ remindText: atLimit });

    expect((await readLead(lead.id)).remindText, 'текст на пределе сохранен целиком').toBe(atLimit);

    await expect(updateLead(lead.id, { remindText: tooLong }), 'update с 501 знаком').rejects.toBeInstanceOf(
      ValidationError,
    );
    expect((await readLead(lead.id)).remindText, 'текст после отказа в update').toBe(atLimit);
  });

  it('S1: у задачи leadReminders расписание в очереди crm с шагом не больше 15 минут', () => {
    expectReminderTask();

    const schedule = reminderTask()?.schedule ?? [];
    const entry = schedule.find((item) => item.queue === QUEUE);

    expect(entry, `расписания в очереди ${QUEUE} у задачи нет; было: ${JSON.stringify(schedule)}`).toBeDefined();
    expectStepWithinLimit(entry?.cron ?? '', 'расписание задачи');
  });

  it('S2: autoRun крутит очередь crm с шагом не больше 15 минут и не выключает постановку по расписанию', async () => {
    const { autoRun } = payload.config.jobs;
    const entries = (typeof autoRun === 'function' ? await autoRun(payload) : autoRun) ?? [];
    const entry = entries.find((item) => item.queue === QUEUE || item.allQueues === true);

    expect(entry, `autoRun без очереди ${QUEUE}; было: ${JSON.stringify(entries)}`).toBeDefined();
    // Без cron Payload крутит autoRun раз в минуту.
    expectStepWithinLimit(entry?.cron ?? '* * * * *', 'autoRun');
    expect(entry?.disableScheduling, 'disableScheduling у записи autoRun').not.toBe(true);
  });
});
