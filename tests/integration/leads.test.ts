import config from '@payload-config';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { NextRequest } from 'next/server';
import { getPayload, type CollectionSlug, type Payload } from 'payload';
import { SMTPServer } from 'smtp-server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import {
  DELETE as restDelete,
  GET as restGet,
  PATCH as restPatch,
  POST as restPost,
} from '@/app/(payload)/api/[...slug]/route';
import { POST as postBrief } from '@/app/api/brief/route';
import { Role } from '@/cms/consts';
import { BRIEF_STEP_VALUES, COMMENT_MAX_LENGTH, HONEYPOT_FIELD, NAME_MAX_LENGTH } from '@/lib/brief/consts';
import { parseLead } from '@/lib/brief/lead';
import { SITE_URL } from '@/lib/consts';
import type { User } from '@/payload-types';

/**
 * Заявка квиза сохраняется в коллекции заявок сайта — CRM студии в админке. Обработчик `POST /api/brief`
 * вызывается напрямую с `NextRequest`, Payload настоящий; Telegram и почта — заглушки на случайных портах,
 * адреса каналов подменяются через env до вызова. Права — REST-обработчики Payload без входа и Local API
 * с `overrideAccess: false`.
 *
 * Бот и почта могут уходить после ответа через `after()` из `next/server`, а он вне запроса Next бросает: подмена
 * запускает задачу на следующем тике, как Next после ответа, и хранит ее промис — тест дожидается задач,
 * чтобы каналы одного сценария не писали в лог и заглушки следующего.
 */

const afterTasks = vi.hoisted(() => [] as Promise<unknown>[]);

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();

  return {
    ...actual,
    after: (task: unknown) => {
      afterTasks.push(
        new Promise((resolve) => setImmediate(resolve))
          .then(() => (typeof task === 'function' ? (task as () => unknown)() : task))
          .catch(() => undefined),
      );
    },
  };
});

const PASSWORD = 'integration-password';

const LEADS = 'leads' as CollectionSlug;

const TELEGRAM_CHAT = '100100';

const LEAD_MAIL_TO = 'leads@example.com';

const ADMIN_LINK = '/admin/collections/leads';

const MARKS = {
  utm_source: 'yandex',
  utm_medium: 'cpc',
  utm_campaign: 'клиники-осень',
  utm_content: 'dental-demo',
  utm_term: 'сайт для клиники',
} as const;

const UTM_FIELDS = Object.keys(MARKS) as (keyof typeof MARKS)[];

const ANSWERS = {
  product: BRIEF_STEP_VALUES.product[1],
  niche: 'clinic',
  design: 'swiss',
  timing: 'twoWeeks',
  budget: 'to250',
  contact: '@leads_probe',
  comment: 'Нужна запись к врачу внутри Telegram.',
  plan: BRIEF_STEP_VALUES.product[1],
};

type LeadDoc = {
  id: number | string;
  source?: string | null;
  product?: string | null;
  niche?: string | null;
  design?: string | null;
  timing?: string | null;
  budget?: string | null;
  name?: string | null;
  contact?: string | null;
  comment?: string | null;
  plan?: string | null;
  page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  locale?: string | null;
  stage?: string | null;
  qualifiedAt?: string | null;
  notes?: { id?: string | null; date?: string | null; text?: string | null }[] | null;
  amount?: number | null;
};

type TelegramCall = { chatId: string; text: string };

type Mail = { to: string[]; text: string };

const telegram = { calls: [] as TelegramCall[], status: 200 };

const mails: Mail[] = [];

let payload: Payload;
let admin: User;
let editor: User;
let telegramServer: Server;
let smtpServer: SMTPServer;
let smtpUrl: string;
let errors: MockInstance<typeof console.error>;
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

const decodeQuotedPrintable = (body: string) => {
  const bytes: number[] = [];
  const unfolded = body.replace(/=\r\n/g, '');

  for (let index = 0; index < unfolded.length; index += 1) {
    if (unfolded[index] === '=' && /^[0-9A-Fa-f]{2}$/.test(unfolded.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(unfolded.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }

    bytes.push(...Buffer.from(unfolded[index], 'utf8'));
  }

  return Buffer.from(bytes).toString('utf8');
};

/** Письмо приходит закодированным, а иногда и из нескольких частей: раскодируется каждая, как в приемнике e2e. */
const decodeMail = (raw: string): string => {
  const separator = raw.indexOf('\r\n\r\n');
  const head = raw.slice(0, separator);
  const body = raw.slice(separator + 4);
  const boundary = head.match(/boundary="?([^";\r\n]+)"?/i)?.[1];

  if (/content-type:\s*multipart\//i.test(head) && boundary) {
    return body
      .split(`--${boundary}`)
      .slice(1)
      .filter((part) => !part.startsWith('--'))
      .map((part) => decodeMail(part.replace(/^\r\n/, '')))
      .join('\n');
  }

  if (/content-transfer-encoding:\s*base64/i.test(head)) {
    return Buffer.from(body, 'base64').toString('utf8');
  }

  if (/content-transfer-encoding:\s*quoted-printable/i.test(head)) {
    return decodeQuotedPrintable(body);
  }

  return body;
};

const portOf = (server: { address: () => AddressInfo | string | null }) => (server.address() as AddressInfo).port;

const listen = (server: Server | SMTPServer) =>
  new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

/** Порт, на котором никто не слушает: SMTP на нем отвечает отказом соединения. */
const closedPort = async () => {
  const server = createServer();

  await listen(server);

  const port = portOf(server);

  await new Promise((resolve) => server.close(resolve));

  return port;
};

const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

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

  return `10.77.${Math.floor(id / 250)}.${(id % 250) + 1}`;
};

const leadsInConfig = () => payload.config.collections.some((collection) => collection.slug === LEADS);

const expectLeadsCollection = () => {
  expect(
    payload.config.collections.map((collection) => collection.slug),
    'коллекции leads нет в конфиге Payload',
  ).toContain(LEADS);
};

/** Все записи коллекции в обход прав: так их видит база, а не посетитель. */
const findLeads = async () => {
  expectLeadsCollection();

  const { docs } = await payload.find({ collection: LEADS, pagination: false, depth: 0, overrideAccess: true });

  return docs as unknown as LeadDoc[];
};

/** Нет коллекции — нет и записей: охранные сценарии не должны падать там, где заявке просто негде лечь. */
const countLeads = async () => (leadsInConfig() ? (await payload.count({ collection: LEADS })).totalDocs : 0);

const readLead = async (id: LeadDoc['id']) =>
  (await payload.findByID({ collection: LEADS, id, depth: 0, overrideAccess: true })) as unknown as LeadDoc;

/** Запись засева в обход прав, как ее положил бы обработчик квиза. */
const seedLead = async (data: Partial<LeadDoc> = {}) => {
  expectLeadsCollection();

  const id = nextId();

  return (await payload.create({
    collection: LEADS,
    data: {
      source: 'site',
      ...ANSWERS,
      name: `Засев ${id} Ангелина`,
      contact: `+7 900 555-${String(id).padStart(2, '0')}-17`,
      page: '/ru/brief',
      locale: 'ru',
      ...data,
    } as never,
    depth: 0,
    overrideAccess: true,
  })) as unknown as LeadDoc;
};

const asAdmin = { overrideAccess: false, user: undefined as unknown as User };

const createAsAdmin = async (data: Partial<LeadDoc> = {}) => {
  expectLeadsCollection();

  const id = nextId();

  return (await payload.create({
    collection: LEADS,
    data: { name: `Звонок ${id}`, contact: `+7 900 100-00-${String(id).padStart(2, '0')}`, ...data } as never,
    depth: 0,
    ...asAdmin,
  })) as unknown as LeadDoc;
};

const updateAsAdmin = async (id: LeadDoc['id'], data: Partial<LeadDoc>) =>
  (await payload.update({ collection: LEADS, id, data: data as never, depth: 0, ...asAdmin })) as unknown as LeadDoc;

/** Время вызова: дата квалификации должна лечь между отметками до и после. */
const timed = async <T>(action: () => Promise<T>) => {
  const before = Date.now();
  const result = await action();
  const after = Date.now();

  return { result, before, after };
};

const expectStampBetween = (stamp: string | null | undefined, before: number, after: number, label: string) => {
  expect(isEmpty(stamp), `${label}: дата квалификации пуста`).toBe(false);

  const time = Date.parse(stamp as string);

  expect(time, `${label}: дата квалификации раньше перевода`).toBeGreaterThanOrEqual(before);
  expect(time, `${label}: дата квалификации позже перевода`).toBeLessThanOrEqual(after);
};

type BriefOptions = {
  marks?: Record<string, string> | null;
  referer?: string | null;
};

const briefBody = (name: string, overrides: Record<string, unknown> = {}) => ({
  ...ANSWERS,
  name,
  consent: true,
  [HONEYPOT_FIELD]: '',
  ...overrides,
});

const sendBrief = (body: unknown, { marks = MARKS, referer = 'https://mrshkn.com/ru/brief' }: BriefOptions = {}) =>
  postBrief(
    new NextRequest('http://localhost/api/brief', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': nextAddress(),
        ...(referer ? { referer } : {}),
        ...(marks ? { cookie: `marks=${encodeURIComponent(JSON.stringify(marks))}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );

/** Маркер в имени заявки: по нему тест находит свое сообщение и письмо. */
const markerName = (label: string) => `Проба ${label} ${nextId()}`;

/** Сбой записи в базу: отклоняется только запись заявки, остальные вызовы Payload идут как обычно. */
const failLeadWrites = () => {
  const create = payload.create.bind(payload);

  vi.spyOn(payload, 'create').mockImplementation(((options: { collection: string }) =>
    options.collection === LEADS
      ? Promise.reject(new Error('база заявок недоступна'))
      : create(options as never)) as unknown as typeof payload.create);
};

const errorLines = () => errors.mock.calls.map((call) => call.map((part) => String(part)).join(' '));

type RestHandler = typeof restGet;

/** REST Payload без cookie и `Authorization`: так его видит посторонний. */
const callRest = async (handler: RestHandler, method: string, slug: string[], body?: unknown) => {
  const response = await handler(
    new NextRequest(`http://localhost/api/${slug.join('/')}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { params: Promise.resolve({ slug }) },
  );

  return { status: response.status, text: await response.text() };
};

const createUser = (email: string, role: Role) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, role } });

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

  smtpServer = new SMTPServer({
    authOptional: true,
    hideSTARTTLS: true,
    disableReverseLookup: true,
    logger: false,
    onData(stream, session, callback) {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        mails.push({
          to: session.envelope.rcptTo.map(({ address }) => address),
          text: decodeMail(Buffer.concat(chunks).toString('utf8')),
        });
        callback();
      });
    },
  });

  await listen(telegramServer);
  await listen(smtpServer);

  smtpUrl = `smtp://127.0.0.1:${portOf(smtpServer.server)}`;
  process.env.TELEGRAM_API_URL = `http://127.0.0.1:${portOf(telegramServer)}`;
  process.env.TELEGRAM_BOT_TOKEN = 'integration-token';
  process.env.TELEGRAM_CHAT_IDS = TELEGRAM_CHAT;
  process.env.SMTP_URL = smtpUrl;
  process.env.LEAD_MAIL_FROM = 'site@mrshkn.com';
  process.env.LEAD_MAIL_TO = LEAD_MAIL_TO;

  admin = await createUser('leads-admin@example.com', Role.Admin);
  editor = await createUser('leads-editor@example.com', Role.Editor);
  asAdmin.user = admin;
});

afterAll(async () => {
  await new Promise((resolve) => telegramServer.close(resolve));
  await new Promise<void>((resolve) => smtpServer.close(() => resolve()));
  await payload.destroy();
});

beforeEach(() => {
  telegram.calls.length = 0;
  telegram.status = 200;
  mails.length = 0;
  process.env.SMTP_URL = smtpUrl;
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  while (afterTasks.length) {
    await Promise.allSettled(afterTasks.splice(0));
  }

  vi.restoreAllMocks();

  if (leadsInConfig()) {
    await payload.delete({ collection: LEADS, where: { id: { exists: true } }, overrideAccess: true });
  }
});

describe('заявка квиза ложится в коллекцию заявок', () => {
  it('L1: заявка с метками — одна запись с полями квиза, метками, языком и этапом «новая»; бот получил ссылку', async () => {
    const name = markerName('записи');
    const response = await sendBrief(briefBody(name));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const leads = await findLeads();

    expect(leads, 'записей заявок после одной отправки').toHaveLength(1);

    const [lead] = leads;

    expect(lead).toMatchObject({
      source: 'site',
      product: ANSWERS.product,
      niche: ANSWERS.niche,
      design: ANSWERS.design,
      timing: ANSWERS.timing,
      budget: ANSWERS.budget,
      name,
      contact: ANSWERS.contact,
      comment: ANSWERS.comment,
      plan: ANSWERS.plan,
      page: '/ru/brief',
      ...MARKS,
      locale: 'ru',
      stage: 'new',
    });
    expect(isEmpty(lead.qualifiedAt), 'дата квалификации у новой заявки').toBe(true);

    await vi.waitFor(() => expect(telegram.calls.length).toBeGreaterThan(0), { timeout: 5000 });

    const [message] = telegram.calls;

    expect(message.chatId).toBe(TELEGRAM_CHAT);
    expect(message.text).toContain(name);
    expect(message.text, 'ссылка на карточку этой записи в админке').toMatch(cardLink(lead.id));
  });

  it('L2: заявка с английского квиза — язык en и адрес страницы /en/brief', async () => {
    const name = markerName('английской');
    const response = await sendBrief(briefBody(name), { referer: 'https://mrshkn.com/en/brief' });

    expect(response.status).toBe(200);

    const leads = await findLeads();

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name, locale: 'en', page: '/en/brief' });
  });

  it('L3: заявка без cookie меток — запись есть, пять utm-полей пусты', async () => {
    const name = markerName('без рекламы');
    const response = await sendBrief(briefBody(name), { marks: null });

    expect(response.status).toBe(200);

    const leads = await findLeads();

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      source: 'site',
      product: ANSWERS.product,
      niche: ANSWERS.niche,
      name,
      contact: ANSWERS.contact,
      page: '/ru/brief',
      locale: 'ru',
      stage: 'new',
    });

    for (const field of UTM_FIELDS) {
      expect(isEmpty(leads[0][field]), `${field} без cookie меток`).toBe(true);
    }
  });

  it('L4: отбитая заявка в коллекцию не попадает — ни по ловушке, ни без согласия', async () => {
    const trapped = await sendBrief(briefBody(markerName('ловушки'), { [HONEYPOT_FIELD]: 'ООО Ромашка' }));

    expect(trapped.status).toBe(200);
    expect(await trapped.json()).toEqual({ ok: true });
    expect(await countLeads(), 'записей после ловушки').toBe(0);

    const withoutConsent = await sendBrief(briefBody(markerName('без согласия'), { consent: false }));

    expect(withoutConsent.status).toBe(422);
    expect(await countLeads(), 'записей после заявки без согласия').toBe(0);
  });

  it('L5: вариант тарифа из прайса сохраняется в plan, заявка не из прайса — plan пусто', async () => {
    const withTier = markerName('варианта');

    expect((await sendBrief(briefBody(withTier, { plan: 'block3d' }))).status).toBe(200);

    const withoutPlan = markerName('без тарифа');
    const body = briefBody(withoutPlan) as Record<string, unknown>;

    delete body.plan;

    expect((await sendBrief(body)).status).toBe(200);

    const leads = await findLeads();
    const byName = (name: string) => leads.find((lead) => lead.name === name);

    expect(leads).toHaveLength(2);
    expect(byName(withTier)?.plan).toBe('block3d');
    expect(byName(withoutPlan), 'запись заявки без тарифа').toBeDefined();
    expect(isEmpty(byName(withoutPlan)?.plan), 'plan у заявки не из прайса').toBe(true);
  });

  it('L6: имя и комментарий на пределе длины ложатся в запись так же, как их обрезает parseLead', async () => {
    const name = `${markerName('длины')} `.padEnd(NAME_MAX_LENGTH, 'Ж');
    const comment = 'Длинный комментарий: '.padEnd(COMMENT_MAX_LENGTH, 'щ');
    const body = briefBody(name, { comment });
    const parsed = parseLead(body, { marks: {}, page: '/ru/brief' });

    expect(name).toHaveLength(NAME_MAX_LENGTH);
    expect(comment).toHaveLength(COMMENT_MAX_LENGTH);
    expect(parsed.ok).toBe(true);

    const expected = parsed.ok ? parsed.lead : null;
    const response = await sendBrief(body);

    expect(response.status).toBe(200);

    const leads = await findLeads();

    expect(leads).toHaveLength(1);
    expect(leads[0].name).toBe(expected?.name);
    expect(leads[0].comment).toBe(expected?.comment);
  });

  it('L7: заявка без referer — адрес страницы «/», язык по умолчанию ru', async () => {
    const name = markerName('без адреса');
    const response = await sendBrief(briefBody(name), { referer: null });

    expect(response.status).toBe(200);

    const leads = await findLeads();

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name, page: '/', locale: 'ru' });
  });
});

describe('сбой записи в базу не теряет заявку', () => {
  it('C1: запись в базу упала — 200, бот и почта получили заявку без ссылки, в логе «не ушла в канал crm»', async () => {
    failLeadWrites();

    const name = markerName('сбоя базы');
    const response = await sendBrief(briefBody(name));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    await vi.waitFor(
      () => {
        expect(telegram.calls.length).toBeGreaterThan(0);
        expect(mails.length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );

    const message = telegram.calls.find((call) => call.text.includes(name));
    const mail = mails.find((item) => item.text.includes(name));

    expect(message, 'сообщение бота с заявкой').toBeDefined();
    expect(mail, 'письмо с заявкой').toBeDefined();
    expect(message?.text).toContain('source=site');
    expect(mail?.text).toContain('source=site');
    expect(message?.text, 'ссылка на карточку в сообщении бота').not.toContain(ADMIN_LINK);
    expect(mail?.text, 'ссылка на карточку в письме').not.toContain(ADMIN_LINK);
    expect(
      errors.mock.calls.some(([first]) => String(first).includes('Заявка не ушла в канал crm')),
      `в логе нет «Заявка не ушла в канал crm»; было: ${JSON.stringify(errorLines())}`,
    ).toBe(true);
  });

  it('C2: база, Telegram и почта упали — 502 delivery, failed: crm, telegram, mail', async () => {
    failLeadWrites();
    telegram.status = 500;
    process.env.SMTP_URL = `smtp://127.0.0.1:${await closedPort()}`;

    const response = await sendBrief(briefBody(markerName('тройного сбоя')));
    const body = (await response.json()) as { ok?: boolean; reason?: string; failed?: string[] };

    expect(response.status).toBe(502);
    expect(body).toMatchObject({ ok: false, reason: 'delivery' });
    expect([...(body.failed ?? [])].sort()).toEqual(['crm', 'mail', 'telegram']);
  });

  it('C3: Telegram ответил 500 — клиенту 200, запись в коллекции есть', async () => {
    telegram.status = 500;

    const name = markerName('сбоя бота');
    const response = await sendBrief(briefBody(name));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const leads = await findLeads();

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name, contact: ANSWERS.contact, stage: 'new' });
  });

  it('C4: все каналы целы — в логе нет строк «не ушла в канал»', async () => {
    const response = await sendBrief(briefBody(markerName('тишины')));

    expect(response.status).toBe(200);

    await vi.waitFor(
      () => {
        expect(telegram.calls.length).toBeGreaterThan(0);
        expect(mails.length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );

    expect(errorLines().filter((line) => line.includes('не ушла в канал'))).toEqual([]);
  });

  it('C5: все каналы целы — письмо несет ссылку на карточку записи, как и сообщение бота', async () => {
    const name = markerName('письма');
    const response = await sendBrief(briefBody(name));

    expect(response.status).toBe(200);

    const leads = await findLeads();

    expect(leads).toHaveLength(1);

    await vi.waitFor(() => expect(mails.length).toBeGreaterThan(0), { timeout: 5000 });

    const mail = mails.find((item) => item.text.includes(name));

    expect(mail, 'письмо с заявкой').toBeDefined();
    expect(mail?.to).toEqual([LEAD_MAIL_TO]);
    expect(mail?.text, 'ссылка на карточку этой записи в письме').toMatch(cardLink(leads[0].id));
  });

  it('C6: база цела, Telegram и почта упали — 200, запись есть: повторной заявки и дубля в CRM нет', async () => {
    telegram.status = 500;
    process.env.SMTP_URL = `smtp://127.0.0.1:${await closedPort()}`;

    const name = markerName('живой базы');
    const response = await sendBrief(briefBody(name));

    expect(response.status, 'ответ при живой базе и упавших боте и почте').toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const leads = await findLeads();

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name, stage: 'new' });
  });

  it('C7: запись в базу зависла — через 5 с бот и почта уходят без ссылки, ответ 200, в логе «не ушла в канал crm»', async () => {
    const create = payload.create.bind(payload);

    vi.spyOn(payload, 'create').mockImplementation(((options: { collection: string }) =>
      options.collection === LEADS
        ? new Promise(() => {})
        : create(options as never)) as unknown as typeof payload.create);

    const name = markerName('зависшей базы');
    const started = Date.now();
    const response = await sendBrief(briefBody(name));
    const elapsed = Date.now() - started;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(elapsed, 'ответ ждал запись не меньше 5 с').toBeGreaterThanOrEqual(4900);
    expect(elapsed, 'ответ не ждал запись дольше 9 с').toBeLessThan(9000);

    await vi.waitFor(
      () => {
        expect(telegram.calls.length).toBeGreaterThan(0);
        expect(mails.length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );

    const message = telegram.calls.find((call) => call.text.includes(name));
    const mail = mails.find((item) => item.text.includes(name));

    expect(message, 'сообщение бота с заявкой').toBeDefined();
    expect(mail, 'письмо с заявкой').toBeDefined();
    expect(message?.text, 'ссылка на карточку в сообщении бота').not.toContain(ADMIN_LINK);
    expect(mail?.text, 'ссылка на карточку в письме').not.toContain(ADMIN_LINK);
    expect(
      errors.mock.calls.some(([first]) => String(first).includes('Заявка не ушла в канал crm')),
      `в логе нет «Заявка не ушла в канал crm»; было: ${JSON.stringify(errorLines())}`,
    ).toBe(true);
  }, 30_000);
});

describe('доступ к заявкам', () => {
  it('R1: REST POST /api/leads без входа — отказ 401 или 403, записей не прибавилось', async () => {
    const before = await countLeads();
    const { status } = await callRest(restPost, 'POST', ['leads'], {
      name: 'Посторонний',
      contact: 'stranger@example.com',
      stage: 'contract',
    });

    expect([401, 403], `статус REST POST: ${status}`).toContain(status);
    expect(await countLeads()).toBe(before);
  });

  it('R2: REST GET /api/leads без входа — отказ 401 или 403, в теле нет записей, имени и контакта', async () => {
    const seed = await seedLead();
    const { status, text } = await callRest(restGet, 'GET', ['leads']);
    const body = JSON.parse(text) as { docs?: unknown[] };

    expect([401, 403], `статус REST GET списка: ${status}`).toContain(status);
    expect(body.docs ?? []).toEqual([]);
    expect(text).not.toContain(seed.name);
    expect(text).not.toContain(seed.contact);
  });

  it('R3: REST GET, PATCH и DELETE записи по id без входа — отказ, имени и контакта нет, запись цела', async () => {
    const seed = await seedLead();
    const slug = ['leads', String(seed.id)];

    for (const [label, call] of [
      ['GET', () => callRest(restGet, 'GET', slug)],
      ['PATCH', () => callRest(restPatch, 'PATCH', slug, { stage: 'rejected', name: 'Подмена', amount: 1 })],
      ['DELETE', () => callRest(restDelete, 'DELETE', slug)],
    ] as const) {
      const { status, text } = await call();

      expect([401, 403, 404], `статус REST ${label}: ${status}`).toContain(status);
      expect(text, `${label}: имя в ответе`).not.toContain(seed.name);
      expect(text, `${label}: контакт в ответе`).not.toContain(seed.contact);
    }

    const after = await readLead(seed.id);

    expect(after).toMatchObject({ name: seed.name, contact: seed.contact, stage: 'new' });
    expect(isEmpty(after.amount), 'сумма после чужого PATCH').toBe(true);
  });

  it('R4: администратор и редактор читают и правят заявку; без пользователя find, update, delete — отказ', async () => {
    const seed = await seedLead();

    for (const [who, user] of [
      ['администратор', admin],
      ['редактор', editor],
    ] as const) {
      const { docs } = await payload.find({
        collection: LEADS,
        overrideAccess: false,
        user,
        pagination: false,
        depth: 0,
      });

      expect(
        (docs as unknown as LeadDoc[]).map(({ id }) => id),
        `${who}: find`,
      ).toContain(seed.id);

      const stage = who === 'администратор' ? 'qualified' : 'proposal';
      const updated = (await payload.update({
        collection: LEADS,
        id: seed.id,
        data: { stage } as never,
        overrideAccess: false,
        user,
        depth: 0,
      })) as unknown as LeadDoc;

      expect(updated.stage, `${who}: update этапа`).toBe(stage);
    }

    const anonymous = { overrideAccess: false } as const;

    await expect(payload.find({ collection: LEADS, ...anonymous }), 'без пользователя: find').rejects.toMatchObject({
      status: 403,
    });
    await expect(
      payload.update({ collection: LEADS, id: seed.id, data: { stage: 'rejected' } as never, ...anonymous }),
      'без пользователя: update',
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      payload.delete({ collection: LEADS, id: seed.id, ...anonymous }),
      'без пользователя: delete',
    ).rejects.toMatchObject({ status: 403 });

    expect(await readLead(seed.id)).toMatchObject({ name: seed.name, stage: 'proposal' });
  });

  it('R5: заявку по звонку заводят администратор и редактор — этап «новая»; без пользователя — отказ', async () => {
    expectLeadsCollection();

    for (const [who, user] of [
      ['администратор', admin],
      ['редактор', editor],
    ] as const) {
      const name = `Звонок ${who} ${nextId()}`;
      const created = (await payload.create({
        collection: LEADS,
        data: { name, contact: '+7 900 200-30-40' } as never,
        overrideAccess: false,
        user,
        depth: 0,
      })) as unknown as LeadDoc;

      expect(created, `${who}: create`).toMatchObject({ name, contact: '+7 900 200-30-40', stage: 'new' });
    }

    const before = await countLeads();

    await expect(
      payload.create({
        collection: LEADS,
        data: { name: 'Аноним', contact: 'anon@example.com' } as never,
        overrideAccess: false,
      }),
      'без пользователя: create',
    ).rejects.toMatchObject({ status: 403 });
    expect(await countLeads()).toBe(before);
  });
});

describe('этап заявки и дата квалификации', () => {
  it('S1: запись без этапа — этап «новая», даты квалификации нет', async () => {
    const lead = await createAsAdmin();

    expect(lead.stage).toBe('new');
    expect(isEmpty(lead.qualifiedAt), 'дата квалификации у новой заявки').toBe(true);
  });

  it('S2: «новая» → «квалифицирована» ставит дату, следующий перевод в «отказ» ее не снимает', async () => {
    const lead = await createAsAdmin();
    const { result: qualified, before, after } = await timed(() => updateAsAdmin(lead.id, { stage: 'qualified' }));

    expect(qualified.stage).toBe('qualified');
    expectStampBetween(qualified.qualifiedAt, before, after, 'new → qualified');

    const rejected = await updateAsAdmin(lead.id, { stage: 'rejected' });

    expect(rejected.stage).toBe('rejected');
    expect(rejected.qualifiedAt, 'qualified → rejected').toBe(qualified.qualifiedAt);
    expect((await readLead(lead.id)).qualifiedAt, 'после перечитывания').toBe(qualified.qualifiedAt);
  });

  it('S3: «новая» → «отказ» — даты квалификации нет', async () => {
    const lead = await createAsAdmin();
    const rejected = await updateAsAdmin(lead.id, { stage: 'rejected' });

    expect(rejected.stage).toBe('rejected');
    expect(isEmpty(rejected.qualifiedAt), 'new → rejected').toBe(true);
    expect(isEmpty((await readLead(lead.id)).qualifiedAt), 'после перечитывания').toBe(true);
  });

  it.each(['qualified', 'proposal', 'contract', 'work', 'delivered'] as const)(
    'S4: «новая» → %s сразу — дата квалификации ставится',
    async (stage) => {
      const lead = await createAsAdmin();
      const { result: moved, before, after } = await timed(() => updateAsAdmin(lead.id, { stage }));

      expect(moved.stage).toBe(stage);
      expectStampBetween(moved.qualifiedAt, before, after, `new → ${stage}`);
    },
  );

  it('S5: дальнейшие переводы и правка с пустой датой первую дату квалификации не меняют', async () => {
    const lead = await createAsAdmin();
    const qualified = await updateAsAdmin(lead.id, { stage: 'qualified' });
    const first = qualified.qualifiedAt;

    expect(isEmpty(first), 'дата после new → qualified').toBe(false);

    for (const stage of ['proposal', 'work'] as const) {
      const moved = await updateAsAdmin(lead.id, { stage });

      expect(moved.stage).toBe(stage);
      expect(moved.qualifiedAt, `→ ${stage}`).toBe(first);
    }

    const cleared = await updateAsAdmin(lead.id, { qualifiedAt: null });

    expect(cleared.qualifiedAt, 'правка с qualifiedAt: null').toBe(first);
    expect((await readLead(lead.id)).qualifiedAt, 'после перечитывания').toBe(first);
  });

  it('S6: «новая» → «отказ» → «квалифицирована» — дата ставится при переводе в «квалифицирована»', async () => {
    const lead = await createAsAdmin();
    const rejected = await updateAsAdmin(lead.id, { stage: 'rejected' });

    expect(isEmpty(rejected.qualifiedAt), 'new → rejected').toBe(true);

    const { result: qualified, before, after } = await timed(() => updateAsAdmin(lead.id, { stage: 'qualified' }));

    expect(qualified.stage).toBe('qualified');
    expectStampBetween(qualified.qualifiedAt, before, after, 'rejected → qualified');
  });

  it('S7: заметки «дата + текст» и сумма сделки в рублях читаются обратно теми же', async () => {
    const notes = [
      { date: '2026-10-20T09:15:00.000Z', text: 'Созвонились, нужен квиз записи' },
      { date: '2026-10-21T14:40:00.000Z', text: 'Отправили КП на 150 000 ₽' },
    ];
    const lead = await createAsAdmin();

    await updateAsAdmin(lead.id, { notes, amount: 150000 });

    const saved = await readLead(lead.id);

    expect(saved.amount).toBe(150000);
    expect(saved.notes).toHaveLength(2);
    expect(
      (saved.notes ?? []).map(({ date, text }) => ({ date: date ? new Date(date).toISOString() : date, text })),
    ).toEqual(notes);
  });
});
