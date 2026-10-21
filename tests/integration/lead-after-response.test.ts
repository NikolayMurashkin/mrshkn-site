import config from '@payload-config';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { createServer as createTcpServer, type AddressInfo, type Server as TcpServer, type Socket } from 'node:net';
import { NextRequest } from 'next/server';
import { getPayload, type CollectionSlug, type Payload } from 'payload';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { POST as postBrief } from '@/app/api/brief/route';
import { BRIEF_STEP_VALUES, HONEYPOT_FIELD } from '@/lib/brief/consts';
import { SITE_URL } from '@/lib/consts';

/**
 * Заявка отвечает посетителю сразу после записи в базу: Telegram и почта уходят после ответа через `after()`
 * из `next/server`, их сбой — строка в логе. Запись не прошла (отказ или зависание) — ответ ждет каналы, как раньше.
 *
 * Обработчик `POST /api/brief` вызывается напрямую, Payload настоящий на базе тестов. `after` вне запроса Next
 * бросает, поэтому подменен: задачи складываются в список и не запускаются, пока тест не запустит их сам —
 * так видно, что ушло до ответа, а что после. Telegram — HTTP-заглушка; почта — TCP-сервер, который принимает
 * соединение и молчит (почтовик, до которого нет ответа), или закрытый порт (отказ).
 */

const afterQueue = vi.hoisted(() => ({ tasks: [] as unknown[], started: [] as Promise<unknown>[] }));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();

  return {
    ...actual,
    after: (task: unknown) => {
      afterQueue.tasks.push(task);
    },
  };
});

const LEADS = 'leads' as CollectionSlug;

const TELEGRAM_CHAT = '100100';

const ADMIN_LINK = '/admin/collections/leads';

const FAST_RESPONSE_MS = 3_000;

const RESPONSE_RACE_MS = 5_000;

const SILENCE_AFTER_RESPONSE_MS = 300;

const DEFERRED = Symbol('ответа нет');

const ANSWERS = {
  product: BRIEF_STEP_VALUES.product[1],
  niche: 'clinic',
  design: 'swiss',
  timing: 'twoWeeks',
  budget: 'to250',
  contact: '@after_probe',
  comment: 'Ответ формы не ждет почту.',
  plan: BRIEF_STEP_VALUES.product[1],
};

type LeadDoc = { id: number | string; name?: string | null };

type TelegramCall = { chatId: string; text: string };

const telegram = { calls: [] as TelegramCall[], status: 200 };

/** Почтовик, который принимает соединение и не присылает приветствия. */
const silentMail = { connections: 0, sockets: new Set<Socket>() };

let payload: Payload;
let telegramServer: Server;
let silentMailServer: TcpServer;
let silentMailUrl: string;
let closedMailUrl: string;
let errors: MockInstance<typeof console.error>;
let sequence = 0;

/** Запросы, ответ на которые тест мог не дождаться: их доводят до конца между тестами. */
const pendingResponses: Promise<unknown>[] = [];

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

const portOf = (server: { address: () => AddressInfo | string | null }) => (server.address() as AddressInfo).port;

const listen = (server: Server | TcpServer) =>
  new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

const close = (server: Server | TcpServer) => new Promise((resolve) => server.close(resolve));

/** Порт, на котором никто не слушает: SMTP на нем отвечает отказом соединения. */
const closedPort = async () => {
  const server = createServer();

  await listen(server);

  const port = portOf(server);

  await close(server);

  return port;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ссылка на карточку именно этой записи: `/leads/1` не должен засчитываться за `/leads/12`. */
const cardLink = (id: LeadDoc['id']) => new RegExp(`${escapeRegExp(`${SITE_URL}${ADMIN_LINK}/${id}`)}(?![\\w-])`);

const nextId = () => {
  sequence += 1;

  return sequence;
};

/** Свой адрес на каждый запрос: лимит заявок живет в памяти обработчика и пережил бы соседние тесты. */
const nextAddress = () => {
  const id = nextId();

  return `10.78.${Math.floor(id / 250)}.${(id % 250) + 1}`;
};

/** Маркер в имени заявки: по нему тест находит свою запись и сообщение. */
const markerName = (label: string) => `Проба после ответа ${label} ${nextId()}`;

const sendBrief = (name: string) => {
  const response = postBrief(
    new NextRequest('http://localhost/api/brief', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': nextAddress(),
        referer: 'https://mrshkn.com/ru/brief',
      },
      body: JSON.stringify({ ...ANSWERS, name, consent: true, [HONEYPOT_FIELD]: '' }),
    }),
  );

  pendingResponses.push(response.catch(() => undefined));

  return response;
};

const leadsNamed = async (name: string) => {
  const { docs } = await payload.find({
    collection: LEADS,
    where: { name: { equals: name } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  return docs as unknown as LeadDoc[];
};

const messageWith = (name: string) => telegram.calls.find((call) => call.text.includes(name));

const errorLines = () => errors.mock.calls.map((call) => call.map((part) => String(part)).join(' '));

const channelLines = () => errorLines().filter((line) => line.includes('Заявка не ушла в канал'));

/** Запускает задачи `after`, как Next после ответа: функцию — вызвать, промис — дождаться. */
const runAfterTasks = () => {
  const tasks = afterQueue.tasks.splice(0);
  const started = tasks.map((task) =>
    Promise.resolve()
      .then(() => (typeof task === 'function' ? (task as () => unknown)() : task))
      .catch(() => undefined),
  );

  afterQueue.started.push(...started);

  return started;
};

const settleAll = async (promises: Promise<unknown>[]) => {
  while (promises.length) {
    await Promise.allSettled(promises.splice(0));
  }
};

/** Отказ записи заявки; остальные вызовы Payload идут как обычно. */
const mockLeadWrites = (write: () => Promise<never>) => {
  const create = payload.create.bind(payload);

  vi.spyOn(payload, 'create').mockImplementation(((options: { collection: string }) =>
    options.collection === LEADS ? write() : create(options as never)) as unknown as typeof payload.create);
};

const rejectLeadWrites = () => mockLeadWrites(() => Promise.reject(new Error('база заявок недоступна')));

const hangLeadWrites = () => mockLeadWrites(() => new Promise<never>(() => {}));

beforeAll(async () => {
  payload = await getPayload({ config });

  telegramServer = createServer(async (request, response) => {
    telegram.calls.push(parseTelegram(await readBody(request)));
    response.writeHead(telegram.status, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify(
        telegram.status === 200
          ? { ok: true, result: { message_id: telegram.calls.length } }
          : { ok: false, description: 'stub failure' },
      ),
    );
  });

  silentMailServer = createTcpServer((socket) => {
    silentMail.connections += 1;
    silentMail.sockets.add(socket);
    socket.on('error', () => {});
    socket.on('close', () => silentMail.sockets.delete(socket));
  });

  await listen(telegramServer);
  await listen(silentMailServer);

  silentMailUrl = `smtp://127.0.0.1:${portOf(silentMailServer)}`;
  closedMailUrl = `smtp://127.0.0.1:${await closedPort()}`;
  process.env.TELEGRAM_API_URL = `http://127.0.0.1:${portOf(telegramServer)}`;
  process.env.TELEGRAM_BOT_TOKEN = 'integration-token';
  process.env.TELEGRAM_CHAT_IDS = TELEGRAM_CHAT;
  process.env.LEAD_MAIL_FROM = 'site@mrshkn.com';
  process.env.LEAD_MAIL_TO = 'leads@example.com';
});

afterAll(async () => {
  for (const socket of silentMail.sockets) {
    socket.destroy();
  }

  await close(telegramServer);
  await close(silentMailServer);
  await payload.destroy();
});

beforeEach(() => {
  telegram.calls.length = 0;
  telegram.status = 200;
  silentMail.connections = 0;
  afterQueue.tasks.length = 0;
  process.env.SMTP_URL = closedMailUrl;
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});

/** Молчащая почта отпускает соединения, запущенные задачи и недождавшиеся ответы доходят до конца — до следующего теста. */
afterEach(async () => {
  for (const socket of silentMail.sockets) {
    socket.destroy();
  }

  await settleAll(afterQueue.started);
  await settleAll(pendingResponses);
  afterQueue.tasks.length = 0;
  vi.restoreAllMocks();
  await payload.delete({ collection: LEADS, where: { id: { exists: true } }, overrideAccess: true });
});

describe('заявка записана — ответ сразу, каналы после ответа', () => {
  it('A1: почта молчит — ответ 200 быстрее 3 с, запись есть; бот и почта получают заявку только после запуска задач after', async () => {
    process.env.SMTP_URL = silentMailUrl;

    const name = markerName('молчащей почты');
    const started = Date.now();
    const outcome = await Promise.race([sendBrief(name), sleep(RESPONSE_RACE_MS).then(() => DEFERRED)]);
    const elapsed = Date.now() - started;

    expect(outcome, `ответа нет за ${RESPONSE_RACE_MS} мс — обработчик ждет почту`).not.toBe(DEFERRED);
    expect(elapsed, 'ответ после записи в базу').toBeLessThan(FAST_RESPONSE_MS);

    const response = outcome as Response;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const leads = await leadsNamed(name);

    expect(leads, 'записей с маркером заявки').toHaveLength(1);
    expect(afterQueue.tasks.length, 'задач, отложенных через after').toBeGreaterThan(0);

    await sleep(SILENCE_AFTER_RESPONSE_MS);

    expect(telegram.calls, 'запросы к боту до запуска задач after').toEqual([]);
    expect(silentMail.connections, 'соединения с почтой до запуска задач after').toBe(0);

    runAfterTasks();

    await vi.waitFor(
      () => {
        expect(messageWith(name), 'сообщение бота с заявкой').toBeDefined();
        expect(silentMail.connections, 'соединения с почтой после запуска задач after').toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );

    expect(messageWith(name)?.chatId).toBe(TELEGRAM_CHAT);
    expect(messageWith(name)?.text, 'ссылка на карточку этой записи').toMatch(cardLink(leads[0].id));
  });

  it('A2: Telegram 500, почта отказала — 200; строки «не ушла в канал» telegram и mail появляются только после задач after, crm — нет', async () => {
    telegram.status = 500;

    const response = await sendBrief(markerName('сбоя каналов'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(channelLines(), 'строки о сбое каналов до запуска задач after').toEqual([]);

    await Promise.allSettled(runAfterTasks());

    const lines = channelLines();

    expect(
      lines.some((line) => line.includes('Заявка не ушла в канал telegram')),
      `в логе нет «Заявка не ушла в канал telegram»; было: ${JSON.stringify(lines)}`,
    ).toBe(true);
    expect(
      lines.some((line) => line.includes('Заявка не ушла в канал mail')),
      `в логе нет «Заявка не ушла в канал mail»; было: ${JSON.stringify(lines)}`,
    ).toBe(true);
    expect(
      lines.filter((line) => line.includes('канал crm')),
      'строки о сбое записи в базу',
    ).toEqual([]);
  });
});

describe('запись не прошла — ответ ждет каналы', () => {
  it('A3: запись отклонена, Telegram 500, почта отказала — 502 delivery, failed: crm, mail, telegram; задач after нет', async () => {
    rejectLeadWrites();
    telegram.status = 500;

    const response = await sendBrief(markerName('тройного сбоя'));
    const body = (await response.json()) as { ok?: boolean; reason?: string; failed?: string[] };

    expect(response.status).toBe(502);
    expect(body).toMatchObject({ ok: false, reason: 'delivery' });
    expect([...(body.failed ?? [])].sort()).toEqual(['crm', 'mail', 'telegram']);
    expect(afterQueue.tasks, 'задачи, отложенные через after').toEqual([]);
  });

  it('A4: запись отклонена, Telegram 200, почта отказала — 200; к ответу бот уже получил заявку без ссылки; задач after нет', async () => {
    rejectLeadWrites();

    const name = markerName('отказа базы');
    const response = await sendBrief(name);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const message = messageWith(name);

    expect(message, 'сообщение бота к моменту ответа').toBeDefined();
    expect(message?.text, 'ссылка на карточку без записи').not.toContain(ADMIN_LINK);
    expect(afterQueue.tasks, 'задачи, отложенные через after').toEqual([]);
  });

  it('A5: запись зависла — ответ не раньше 4,9 с, 200; к ответу бот уже получил заявку без ссылки; задач after нет', async () => {
    hangLeadWrites();

    const name = markerName('зависшей базы');
    const started = Date.now();
    const response = await sendBrief(name);
    const elapsed = Date.now() - started;

    expect(elapsed, 'ответ ждал запись до таймаута').toBeGreaterThanOrEqual(4900);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const message = messageWith(name);

    expect(message, 'сообщение бота к моменту ответа').toBeDefined();
    expect(message?.text, 'ссылка на карточку без записи').not.toContain(ADMIN_LINK);
    expect(afterQueue.tasks, 'задачи, отложенные через after').toEqual([]);
  }, 30_000);
});
