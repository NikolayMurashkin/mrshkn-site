import config from '@payload-config';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { NextRequest } from 'next/server';
import { getPayload, type CollectionSlug, type Payload } from 'payload';
import { SMTPServer } from 'smtp-server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as postAudit } from '@/app/api/audit/route';
import { POST as postBrief } from '@/app/api/brief/route';
import { BRIEF_STEP_VALUES, HONEYPOT_FIELD, LEAD_RATE_LIMIT } from '@/lib/brief/consts';
import { SITE_URL } from '@/lib/consts';

/**
 * Заявка на бесплатный замер — тот же путь заявок сайта, что у квиза: запись в коллекцию заявок с видом «замер»
 * и адресом сайта, ответ сразу, Telegram и почта после ответа. Отказ — 400 с причиной, записи нет. Обработчик
 * `POST /api/audit` вызывается напрямую с `NextRequest`, Payload настоящий; Telegram и почта — заглушки на случайных
 * портах, адреса каналов подменяются через env.
 *
 * `after()` из `next/server` вне запроса Next бросает: подмена запускает задачу на следующем тике, как Next после
 * ответа, и хранит ее промис — тест дожидается задач, чтобы каналы одного сценария не писали в заглушки следующего.
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

const LEADS = 'leads' as CollectionSlug;

const TELEGRAM_CHAT = '100100';

const LEAD_MAIL_TO = 'leads@example.com';

const ADMIN_LINK = '/admin/collections/leads';

const MARKS = { utm_source: 'yandex', utm_campaign: 'замер-осень' } as const;

const REFERER = 'http://localhost/ru/industry';

const AUDIT = { name: 'Анна Замер', url: 'example.ru', contact: '@audit_probe', consent: true };

const SITE = 'https://example.ru/';

const BRIEF = {
  product: BRIEF_STEP_VALUES.product[1],
  niche: 'clinic',
  design: 'swiss',
  timing: 'twoWeeks',
  budget: 'to250',
  name: 'Квиз рядом с замером',
  contact: '@brief_probe',
  comment: '',
  consent: true,
  [HONEYPOT_FIELD]: '',
};

type LeadDoc = {
  id: number | string;
  kind?: string | null;
  siteUrl?: string | null;
  name?: string | null;
  contact?: string | null;
  page?: string | null;
  locale?: string | null;
  stage?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
};

type TelegramCall = { chatId: string; text: string };

type Mail = { to: string[]; text: string };

type SendOptions = { marks?: Record<string, string> | null; referer?: string | null; address?: string };

const telegram = { calls: [] as TelegramCall[] };

const mails: Mail[] = [];

let payload: Payload;
let telegramServer: Server;
let smtpServer: SMTPServer;
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

const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ссылка на карточку именно этой записи: `/leads/1` не должен засчитываться за `/leads/12`. */
const cardLink = (id: LeadDoc['id']) => new RegExp(`${escapeRegExp(`${SITE_URL}${ADMIN_LINK}/${id}`)}(?![\\w-])`);

/** Свой адрес на каждый запрос: лимит заявок живет в памяти обработчика и пережил бы соседние тесты. */
const nextAddress = () => {
  sequence += 1;

  return `10.78.${Math.floor(sequence / 250)}.${(sequence % 250) + 1}`;
};

const findLeads = async () => {
  const { docs } = await payload.find({ collection: LEADS, pagination: false, depth: 0, overrideAccess: true });

  return docs as unknown as LeadDoc[];
};

const countLeads = async () => (await payload.count({ collection: LEADS, overrideAccess: true })).totalDocs;

const settleAfterTasks = async () => {
  while (afterTasks.length) {
    await Promise.allSettled(afterTasks.splice(0));
  }
};

const headersOf = ({ marks = MARKS, referer = REFERER, address = nextAddress() }: SendOptions) => ({
  'content-type': 'application/json',
  'x-forwarded-for': address,
  ...(referer ? { referer } : {}),
  ...(marks ? { cookie: `marks=${encodeURIComponent(JSON.stringify(marks))}` } : {}),
});

const sendAuditRaw = (body: string, options: SendOptions = {}) =>
  postAudit(new NextRequest('http://localhost/api/audit', { method: 'POST', headers: headersOf(options), body }));

const sendAudit = (body: unknown, options: SendOptions = {}) => sendAuditRaw(JSON.stringify(body), options);

const sendBrief = (body: unknown) =>
  postBrief(
    new NextRequest('http://localhost/api/brief', {
      method: 'POST',
      headers: headersOf({ referer: 'http://localhost/ru/brief' }),
      body: JSON.stringify(body),
    }),
  );

/** Отказ: 400 с причиной, в базе пусто, ни бот, ни почта не получили заявку. */
const expectRejected = async (response: Response, reason: string) => {
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ ok: false, reason });

  await settleAfterTasks();

  expect(await countLeads(), 'записей после отказа').toBe(0);
  expect(telegram.calls, 'вызовы Telegram после отказа').toEqual([]);
  expect(mails, 'письма после отказа').toEqual([]);
};

const withoutField = (field: keyof typeof AUDIT) =>
  Object.fromEntries(Object.entries(AUDIT).filter(([key]) => key !== field));

beforeAll(async () => {
  payload = await getPayload({ config });

  telegramServer = createServer(async (request, response) => {
    telegram.calls.push(parseTelegram(await readBody(request)));
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, result: { message_id: telegram.calls.length } }));
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

  process.env.TELEGRAM_API_URL = `http://127.0.0.1:${portOf(telegramServer)}`;
  process.env.TELEGRAM_BOT_TOKEN = 'integration-token';
  process.env.TELEGRAM_CHAT_IDS = TELEGRAM_CHAT;
  process.env.SMTP_URL = `smtp://127.0.0.1:${portOf(smtpServer.server)}`;
  process.env.LEAD_MAIL_FROM = 'site@mrshkn.com';
  process.env.LEAD_MAIL_TO = LEAD_MAIL_TO;
});

afterAll(async () => {
  await new Promise((resolve) => telegramServer.close(resolve));
  await new Promise<void>((resolve) => smtpServer.close(() => resolve()));
  await payload.destroy();
});

beforeEach(() => {
  telegram.calls.length = 0;
  mails.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  await settleAfterTasks();
  vi.restoreAllMocks();
  await payload.delete({ collection: LEADS, where: { id: { exists: true } }, overrideAccess: true });
});

describe('заявка на замер ложится в коллекцию заявок', () => {
  it('I1: адрес и контакт → 200 и одна запись вида «замер» с нормализованным адресом, страницей, языком и метками', async () => {
    const response = await sendAudit(AUDIT);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const leads = await findLeads();

    expect(leads, 'записей после одной заявки').toHaveLength(1);
    expect(leads[0]).toMatchObject({
      kind: 'audit',
      siteUrl: SITE,
      name: AUDIT.name,
      contact: AUDIT.contact,
      page: '/ru/industry',
      locale: 'ru',
      stage: 'new',
      utm_source: MARKS.utm_source,
      utm_campaign: MARKS.utm_campaign,
    });
  });

  it.each([
    ['адреса нет', withoutField('url')],
    ['адрес пустой', { ...AUDIT, url: '' }],
    ['адрес ftp', { ...AUDIT, url: 'ftp://example.ru' }],
    ['адрес javascript', { ...AUDIT, url: 'javascript:alert(1)' }],
  ])('I2: %s → 400 url, записи нет, каналы молчат', async (_label, body) => {
    await expectRejected(await sendAudit(body), 'url');
  });

  it.each([
    ['согласие false', { ...AUDIT, consent: false }],
    ['согласия нет', withoutField('consent')],
  ])('I3: %s → 400 consent, записи нет', async (_label, body) => {
    await expectRejected(await sendAudit(body), 'consent');
  });

  it.each([
    ['пустой контакт', { ...AUDIT, contact: '' }],
    ['пустое имя', { ...AUDIT, name: '' }],
  ])('I4: %s → 400 fields, записи нет', async (_label, body) => {
    await expectRejected(await sendAudit(body), 'fields');
  });

  it('I5: тело не JSON → 400, записи нет', async () => {
    await expectRejected(await sendAuditRaw('name=Анна&url=example.ru'), 'fields');
  });

  it('I6: заполненная ловушка → 200 как человеку, записи нет, каналы молчат', async () => {
    const response = await sendAudit({ ...AUDIT, [HONEYPOT_FIELD]: 'x' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    await settleAfterTasks();

    expect(await countLeads()).toBe(0);
    expect(telegram.calls).toEqual([]);
    expect(mails).toEqual([]);
  });

  it('I7: после ответа бот и почта получают заявку «замер» с сайтом, контактом и ссылкой на карточку', async () => {
    const response = await sendAudit(AUDIT);

    expect(response.status).toBe(200);

    const [lead] = await findLeads();

    expect(lead, 'запись заявки').toBeDefined();

    await settleAfterTasks();

    expect(telegram.calls, 'вызовы Telegram').toHaveLength(1);

    const [message] = telegram.calls;

    expect(message.chatId).toBe(TELEGRAM_CHAT);
    expect(message.text).toContain('Заявка: замер');
    expect(message.text).toContain(`Сайт: ${SITE}`);
    expect(message.text).toContain(AUDIT.contact);
    expect(message.text, 'ссылка на карточку этой записи').toMatch(cardLink(lead.id));

    expect(mails, 'письма').toHaveLength(1);

    const [mail] = mails;

    expect(mail.to).toEqual([LEAD_MAIL_TO]);
    expect(mail.text).toContain('Заявка: замер');
    expect(mail.text).toContain(`Сайт: ${SITE}`);
    expect(mail.text).toContain(AUDIT.contact);
    expect(mail.text, 'ссылка на карточку этой записи').toMatch(cardLink(lead.id));
  });

  it('I8: заявка сверх лимита с одного адреса → 429', async () => {
    const address = nextAddress();
    const statuses: number[] = [];

    for (let index = 0; index <= LEAD_RATE_LIMIT.limit; index += 1) {
      statuses.push((await sendAudit({ ...AUDIT, name: `${AUDIT.name} ${index}` }, { address })).status);
    }

    expect(statuses).toEqual([...Array.from({ length: LEAD_RATE_LIMIT.limit }, () => 200), 429]);
  });

  it('I9: заявка квиза пишется с видом «квиз» и без адреса сайта', async () => {
    const response = await sendBrief(BRIEF);

    expect(response.status).toBe(200);

    const leads = await findLeads();

    expect(leads).toHaveLength(1);
    expect(leads[0].kind).toBe('brief');
    expect(isEmpty(leads[0].siteUrl), 'адрес сайта у заявки квиза').toBe(true);
  });
});
