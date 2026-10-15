import config from '@payload-config';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { getPayload, type CollectionSlug, type Payload } from 'payload';
import { SMTPServer } from 'smtp-server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as postInvite } from '@/app/api/review/invite/route';
import { POST as postReview } from '@/app/api/review/route';
import { Reviews } from '@/cms/collections/Reviews';
import { Role } from '@/cms/consts';
import { getReviewState } from '@/cms/reviews';
import type { User } from '@/payload-types';
import { reviewDocuments } from '@/lib/review/documents';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

/**
 * Отзыв клиент оставляет только по личной ссылке. Коллекция, обработчик формы и отправка приглашения проверяются
 * на настоящем Payload: права — Local API с `overrideAccess: false`, обработчики — прямым вызовом с `NextRequest`.
 * Telegram и почта — заглушки на случайных портах, адреса каналов подменяются через env до вызова.
 */

const PASSWORD = 'integration-password';

const REVIEWS = 'reviews' as CollectionSlug;

const DAY_MS = 24 * 60 * 60 * 1000;

const INVITE_TTL_MS = 60 * DAY_MS;

const TELEGRAM_CHAT = '100100';

const CYRILLIC = /[А-Яа-яЁё]/;

/** Пункты документов, которые автор видел в форме: в сохраненном тексте должен быть каждый, а не только заголовок. */
const DOCUMENT_ITEMS = { ru: ru.review.documents, en: en.review.documents } as const;

const expectDocumentItems = (saved: ReviewDoc, locale: 'ru' | 'en') => {
  const { consent, license } = DOCUMENT_ITEMS[locale];

  expect(consent.items.length, `${locale}: пунктов согласия`).toBe(8);
  expect(license.items.length, `${locale}: пунктов разрешения`).toBe(4);

  for (const item of consent.items) {
    expect(saved.consentText ?? '', `${locale}: пункт согласия в записи`).toContain(item);
  }

  for (const item of license.items) {
    expect(saved.licenseText ?? '', `${locale}: пункт разрешения в записи`).toContain(item);
  }
};

const STATUSES = ['invited', 'received', 'published', 'rejected', 'withdrawn'] as const;

type Status = (typeof STATUSES)[number];

/** Поля, которые публично не читаются даже у опубликованного отзыва. */
const PRIVATE_FIELDS = ['email', 'code', 'fullName', 'consentText', 'licenseText', 'restrictions'] as const;

type ReviewDoc = {
  id: number | string;
  project?: string;
  email?: string;
  inviteLocale?: string;
  code?: string | null;
  sentAt?: string | null;
  expiresAt?: string | null;
  status?: string;
  locale?: string | null;
  fullName?: string | null;
  signature?: string | null;
  occupation?: string | null;
  link?: string | null;
  answers?: { before?: string | null; process?: string | null; after?: string | null } | null;
  consentText?: string | null;
  licenseText?: string | null;
  consentVersion?: string | null;
  consentAt?: string | null;
  restrictions?: { noTransfer?: boolean | null; noLink?: boolean | null; other?: string | null } | null;
  withdrawnAt?: string | null;
  translation?: { text?: string | null; approved?: boolean | null; approvedAt?: string | null } | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Значения засева нарочно непохожи друг на друга и на название проекта: по ним ищется утечка ПД в уведомлении. */
const AUTHOR = {
  fullName: 'Белова Ирина Сергеевна',
  signature: 'Ирина, кофейня у моста',
  occupation: 'Владелица кофейни',
  link: 'https://zerno.example.com/about',
  answers: {
    before: 'Пришли за сайтом с записью на дегустации',
    process: 'Созванивались раз в неделю, правки вносили в тот же день',
    after: 'Заявок с сайта стало вдвое больше',
  },
};

const RESTRICTIONS = { noTransfer: true, noLink: false, other: 'Не цитировать в рекламе' };

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

/** Время на то, чтобы уведомление, отправленное без ожидания ответа клиенту, успело дойти до заглушки. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

const iso = (time: number) => new Date(time).toISOString();

const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

const uniqueCode = () => randomBytes(16).toString('base64url');

const nextId = () => {
  sequence += 1;

  return sequence;
};

const createUser = (email: string, role: Role) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, role } });

const loginAs = async (user: User) => {
  const { token } = await payload.login({ collection: 'users', data: { email: user.email, password: PASSWORD } });

  return token ?? '';
};

const createReview = async (data: Partial<ReviewDoc>) => {
  expect(
    payload.config.collections.map((collection) => collection.slug),
    'коллекции reviews нет в конфиге Payload',
  ).toContain(REVIEWS);

  return (await payload.create({ collection: REVIEWS, data: data as never, depth: 0 })) as unknown as ReviewDoc;
};

const readReview = async (id: ReviewDoc['id']) =>
  (await payload.findByID({ collection: REVIEWS, id, depth: 0 })) as unknown as ReviewDoc;

const countReviews = async () => (await payload.count({ collection: REVIEWS })).totalDocs;

/** Приглашение, отправленное только что: код действует еще 60 дней. */
const invited = (overrides: Partial<ReviewDoc> = {}) => {
  const id = nextId();
  const now = Date.now();

  return createReview({
    project: `Проект ${id}`,
    email: `client-${id}@example.com`,
    inviteLocale: 'ru',
    status: 'invited',
    code: uniqueCode(),
    sentAt: iso(now),
    expiresAt: iso(now + INVITE_TTL_MS),
    ...overrides,
  });
};

/** Приглашение, заведенное в админке и еще не отправленное: кода и сроков нет. */
const unsent = (inviteLocale: 'ru' | 'en', overrides: Partial<ReviewDoc> = {}) => {
  const id = nextId();

  return createReview({
    project: `Bakery ${id}`,
    email: `invite-${id}@example.com`,
    inviteLocale,
    status: 'invited',
    ...overrides,
  });
};

/** Отзыв, который клиент уже прислал: поля автора, согласие, запреты и перевод заполнены. */
const received = (overrides: Partial<ReviewDoc> = {}) => {
  const now = Date.now();

  return invited({
    status: 'received',
    locale: 'ru',
    ...AUTHOR,
    consentText: 'Текст согласия засева',
    licenseText: 'Текст разрешения засева',
    consentVersion: '0.1',
    consentAt: iso(now - DAY_MS),
    restrictions: RESTRICTIONS,
    translation: { text: 'Translated review text', approved: true, approvedAt: iso(now) },
    ...overrides,
  });
};

type ReviewBody = Record<string, unknown> & { answers: Record<string, string>; restrictions: Record<string, unknown> };

const reviewBody = (code: string | null | undefined, overrides: Record<string, unknown> = {}): ReviewBody => ({
  code,
  locale: 'ru',
  ...AUTHOR,
  answers: { ...AUTHOR.answers },
  consent: true,
  license: true,
  restrictions: { ...RESTRICTIONS },
  ...overrides,
});

const sendReview = (body: unknown) =>
  postReview(
    new NextRequest('http://localhost/api/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const sendInvite = (body: { id: ReviewDoc['id']; action: 'send' | 'renew' }, token?: string) =>
  postInvite(
    new NextRequest('http://localhost/api/review/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `JWT ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );

/** Отказ Local API: статус ошибки или `null`, если документ все-таки отдан. */
const failureOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: { status?: number }) => error,
  );

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

  admin = await createUser('reviews-admin@example.com', Role.Admin);
  editor = await createUser('reviews-editor@example.com', Role.Editor);
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
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('доступ к отзывам', () => {
  const seed = {} as Record<Status, ReviewDoc>;

  const seedIds = () => STATUSES.map((status) => seed[status].id);

  let seeding: Promise<void> | null = null;

  /** Засев по записи на каждый статус, один на все тесты доступа: без коллекции каждый тест падает на ее проверке. */
  const seeded = () => {
    seeding ??= (async () => {
      for (const status of STATUSES) {
        seed[status] = await received({ project: `Доступ ${status}`, status });
      }
    })();

    return seeding;
  };

  it('A1: без пользователя find отдает ровно опубликованную запись засева', async () => {
    await seeded();

    const { docs } = await payload.find({ collection: REVIEWS, overrideAccess: false, pagination: false, depth: 0 });
    const visible = docs as unknown as ReviewDoc[];

    expect(visible.map(({ id }) => id).filter((id) => seedIds().includes(id))).toEqual([seed.published.id]);
    expect(visible.map(({ status }) => status)).toEqual(visible.map(() => 'published'));
  });

  it('A2: под редактором find отдает ровно опубликованную запись засева', async () => {
    await seeded();

    const { docs } = await payload.find({
      collection: REVIEWS,
      overrideAccess: false,
      user: editor,
      pagination: false,
      depth: 0,
    });
    const visible = docs as unknown as ReviewDoc[];

    expect(visible.map(({ id }) => id).filter((id) => seedIds().includes(id))).toEqual([seed.published.id]);
    expect(visible.map(({ status }) => status)).toEqual(visible.map(() => 'published'));
  });

  it('A3: неопубликованная запись по id без пользователя и под редактором — отказ, не документ', async () => {
    await seeded();

    for (const status of STATUSES.filter((item) => item !== 'published')) {
      for (const [who, user] of [
        ['без пользователя', undefined],
        ['редактор', editor],
      ] as const) {
        const error = await failureOf(
          payload.findByID({ collection: REVIEWS, id: seed[status].id, overrideAccess: false, user, depth: 0 }),
        );

        expect([403, 404], `${status}, ${who}`).toContain(error?.status);
      }
    }
  });

  it('A4: у опубликованной публично нет почты, кода, ФИО, текстов согласий и запретов; подпись и ответы есть', async () => {
    await seeded();

    for (const [who, user] of [
      ['без пользователя', undefined],
      ['редактор', editor],
    ] as const) {
      const doc = (await payload.findByID({
        collection: REVIEWS,
        id: seed.published.id,
        overrideAccess: false,
        user,
        depth: 0,
      })) as unknown as Record<string, unknown>;

      for (const field of PRIVATE_FIELDS) {
        expect(doc[field] ?? null, `${who}: ${field}`).toBeNull();
      }

      expect(doc.signature, `${who}: подпись`).toBe(AUTHOR.signature);
      expect(doc.answers, `${who}: ответы`).toMatchObject(AUTHOR.answers);
    }

    const asAdmin = (await payload.findByID({
      collection: REVIEWS,
      id: seed.published.id,
      overrideAccess: false,
      user: admin,
      depth: 0,
    })) as unknown as ReviewDoc;

    expect(asAdmin).toMatchObject({
      email: seed.published.email,
      code: seed.published.code,
      fullName: AUTHOR.fullName,
      consentText: 'Текст согласия засева',
    });
  });

  it('A5: создать, изменить и удалить без пользователя и под редактором нельзя; администратор изменяет', async () => {
    await seeded();

    for (const [who, user] of [
      ['без пользователя', undefined],
      ['редактор', editor],
    ] as const) {
      const access = { overrideAccess: false, user } as const;
      const total = await countReviews();
      const invitedBefore = await readReview(seed.invited.id);
      const publishedBefore = await readReview(seed.published.id);
      const receivedBefore = await readReview(seed.received.id);

      await expect(
        payload.create({
          collection: REVIEWS,
          data: { project: `Чужой ${who}`, email: 'stranger@example.com', inviteLocale: 'ru' } as never,
          ...access,
        }),
        `${who}: create`,
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        payload.update({ collection: REVIEWS, id: seed.invited.id, data: { status: 'published' } as never, ...access }),
        `${who}: update status → published`,
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        payload.update({
          collection: REVIEWS,
          id: seed.published.id,
          data: { signature: `Подменено: ${who}` } as never,
          ...access,
        }),
        `${who}: update подписи`,
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        payload.delete({ collection: REVIEWS, id: seed.received.id, ...access }),
        `${who}: delete`,
      ).rejects.toMatchObject({ status: 403 });

      expect(await countReviews(), `${who}: число записей`).toBe(total);
      expect(await readReview(seed.invited.id), `${who}: приглашение`).toEqual(invitedBefore);
      expect(await readReview(seed.published.id), `${who}: опубликованный`).toEqual(publishedBefore);
      expect(await readReview(seed.received.id), `${who}: полученный`).toEqual(receivedBefore);
    }

    const project = 'Доступ rejected, правка администратора';
    const updated = (await payload.update({
      collection: REVIEWS,
      id: seed.rejected.id,
      data: { project } as never,
      overrideAccess: false,
      user: admin,
      depth: 0,
    })) as unknown as ReviewDoc;

    expect(updated.project).toBe(project);
    expect((await readReview(seed.rejected.id)).project).toBe(project);
  });

  it('A6: администратор видит все пять записей засева', async () => {
    await seeded();

    const { docs } = await payload.find({
      collection: REVIEWS,
      overrideAccess: false,
      user: admin,
      pagination: false,
      depth: 0,
    });
    const ids = (docs as unknown as ReviewDoc[]).map(({ id }) => id);

    expect(seedIds().filter((id) => ids.includes(id))).toEqual(seedIds());
  });

  it('A7: публично ссылка скрыта при запрете «не публиковать ссылку» и без отметки, по ней не ищут; перевод — пока автор его не подтвердил', async () => {
    const now = Date.now();
    const noLink = await received({
      project: 'Доступ: запрет ссылки',
      status: 'published',
      restrictions: { ...RESTRICTIONS, noLink: true },
    });
    const unmarked = await received({
      project: 'Доступ: отметка о ссылке не задана',
      status: 'published',
      restrictions: { ...RESTRICTIONS, noLink: null } as never,
    });
    const unapproved = await received({
      project: 'Доступ: перевод без подтверждения',
      status: 'published',
      translation: { text: 'Unapproved translation', approved: false, approvedAt: null },
    });
    const open = await received({
      project: 'Доступ: ссылка и перевод открыты',
      status: 'published',
      restrictions: { ...RESTRICTIONS, noLink: false },
      translation: { text: 'Approved translation', approved: true, approvedAt: iso(now) },
    });

    for (const [who, user] of [
      ['без пользователя', undefined],
      ['редактор', editor],
    ] as const) {
      const read = async (id: ReviewDoc['id']) =>
        (await payload.findByID({
          collection: REVIEWS,
          id,
          overrideAccess: false,
          user,
          depth: 0,
        })) as unknown as ReviewDoc;

      expect((await read(noLink.id)).link ?? null, `${who}: ссылка при запрете`).toBeNull();
      expect((await read(unmarked.id)).link ?? null, `${who}: ссылка без отметки`).toBeNull();
      expect((await read(unapproved.id)).translation?.text ?? null, `${who}: неподтвержденный перевод`).toBeNull();
      expect((await read(open.id)).link, `${who}: ссылка без запрета`).toBe(AUTHOR.link);
      expect((await read(open.id)).translation?.text, `${who}: подтвержденный перевод`).toBe('Approved translation');

      const selected = await payload.find({
        collection: REVIEWS,
        where: { id: { equals: noLink.id } },
        select: { link: true } as never,
        overrideAccess: false,
        user,
        depth: 0,
      });

      expect(
        (selected.docs[0] as unknown as ReviewDoc).link ?? null,
        `${who}: ссылка при запрете через select`,
      ).toBeNull();

      const excluded = await payload.find({
        collection: REVIEWS,
        where: { id: { equals: noLink.id } },
        select: { restrictions: false } as never,
        overrideAccess: false,
        user,
        depth: 0,
      });

      expect(
        (excluded.docs[0] as unknown as ReviewDoc).link ?? null,
        `${who}: ссылка при запрете через select с исключением запретов`,
      ).toBeNull();

      const readSelected = async (select: Record<string, unknown>) =>
        (await payload.findByID({
          collection: REVIEWS,
          id: open.id,
          select: select as never,
          overrideAccess: false,
          user,
          depth: 0,
        })) as unknown as ReviewDoc;

      expect((await readSelected({ link: true })).link, `${who}: ссылка без запрета через select`).toBe(AUTHOR.link);
      expect(
        (await readSelected({ translation: true })).translation?.text,
        `${who}: подтвержденный перевод через select группы`,
      ).toBe('Approved translation');
      expect(
        (await readSelected({ translation: { text: true } })).translation?.text,
        `${who}: подтвержденный перевод через select поля`,
      ).toBe('Approved translation');

      const byLink = { link: { like: AUTHOR.link.slice(0, 12) } };
      const notQueryable = { status: 400, message: expect.stringContaining('cannot be queried: link') };

      await expect(
        payload.find({ collection: REVIEWS, where: byLink, overrideAccess: false, user, depth: 0 }),
        `${who}: поиск по ссылке`,
      ).rejects.toMatchObject(notQueryable);
      await expect(
        payload.count({ collection: REVIEWS, where: byLink, overrideAccess: false, user }),
        `${who}: подсчет по ссылке`,
      ).rejects.toMatchObject(notQueryable);
      await expect(
        payload.find({ collection: REVIEWS, sort: 'link', overrideAccess: false, user, depth: 0 }),
        `${who}: сортировка по ссылке`,
      ).rejects.toMatchObject(notQueryable);
      await expect(
        payload.findDistinct({ collection: REVIEWS, field: 'link' as never, overrideAccess: false, user }),
        `${who}: различные ссылки`,
      ).rejects.toMatchObject({ status: 403 });
    }

    const asAdmin = (await payload.findByID({
      collection: REVIEWS,
      id: noLink.id,
      overrideAccess: false,
      user: admin,
      depth: 0,
    })) as unknown as ReviewDoc;

    expect(asAdmin.link, 'администратор видит ссылку').toBe(AUTHOR.link);

    const asAdminRestrictions = (await payload.findByID({
      collection: REVIEWS,
      id: open.id,
      select: { restrictions: true } as never,
      overrideAccess: false,
      user: admin,
      depth: 0,
    })) as unknown as ReviewDoc;

    expect(asAdminRestrictions.restrictions, 'администратор получает запреты через select группы').toMatchObject({
      ...RESTRICTIONS,
      noLink: false,
    });

    const byLink = { link: { like: AUTHOR.link.slice(0, 12) } };
    const asAdminFound = await payload.count({
      collection: REVIEWS,
      where: byLink,
      overrideAccess: false,
      user: admin,
    });

    expect(asAdminFound.totalDocs, 'администратор ищет по ссылке').toBeGreaterThanOrEqual(3);
    await expect(
      payload.find({ collection: REVIEWS, sort: 'link', overrideAccess: false, user: admin, depth: 0 }),
      'администратор сортирует по ссылке',
    ).resolves.toBeDefined();
    await expect(
      payload.findDistinct({ collection: REVIEWS, field: 'link' as never, overrideAccess: false, user: admin }),
      'администратор получает различные ссылки',
    ).resolves.toMatchObject({ values: expect.arrayContaining([{ link: AUTHOR.link }]) });
  });
});

describe('POST /api/review', () => {
  it('P1: действующий код, все поля и обе отметки → 200, запись «получен» с языком страницы, документами и запретами', async () => {
    const record = await invited({ inviteLocale: 'ru' });
    const body = reviewBody(record.code, { locale: 'en' });

    const before = Date.now();
    const response = await sendReview(body);
    const after = Date.now();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const saved = await readReview(record.id);
    const documents = reviewDocuments('en');

    expect(saved).toMatchObject({
      status: 'received',
      locale: 'en',
      fullName: AUTHOR.fullName,
      signature: AUTHOR.signature,
      occupation: AUTHOR.occupation,
      link: AUTHOR.link,
      answers: AUTHOR.answers,
      consentText: documents.consent,
      licenseText: documents.license,
      consentVersion: documents.version,
      restrictions: RESTRICTIONS,
    });
    expect(saved.consentText).toMatch(/\S/);
    expect(saved.licenseText).toMatch(/\S/);
    expect(CYRILLIC.test(saved.consentText ?? ''), 'в английском согласии нет кириллицы').toBe(false);
    expect(CYRILLIC.test(saved.licenseText ?? ''), 'в английском разрешении нет кириллицы').toBe(false);
    expect(saved.consentVersion).toMatch(/\S/);
    expectDocumentItems(saved, 'en');
    expect(Date.parse(saved.consentAt ?? '')).toBeGreaterThanOrEqual(before);
    expect(Date.parse(saved.consentAt ?? '')).toBeLessThanOrEqual(after);
  });

  it('P2: тот же код второй раз → 409, запись не изменилась', async () => {
    const record = await invited();

    expect((await sendReview(reviewBody(record.code))).status).toBe(200);

    const first = await readReview(record.id);
    const response = await sendReview(
      reviewBody(record.code, { fullName: 'Другой Автор Повтора', signature: 'Подпись повтора' }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'used' });
    expect(await readReview(record.id)).toEqual(first);
  });

  it('P3: код с истекшим сроком (61-й день) → 404, запись осталась приглашением без полей автора', async () => {
    const now = Date.now();
    const record = await invited({ sentAt: iso(now - 61 * DAY_MS), expiresAt: iso(now - DAY_MS) });

    const response = await sendReview(reviewBody(record.code));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'invalid' });

    const saved = await readReview(record.id);

    expect(saved.status).toBe('invited');
    expect(isEmpty(saved.fullName), 'ФИО не записано').toBe(true);
    expect(isEmpty(saved.answers?.before), 'ответ не записан').toBe(true);
  });

  it('P4: неизвестный код → 404, число записей не изменилось', async () => {
    await invited();

    const total = await countReviews();
    const response = await sendReview(reviewBody(uniqueCode()));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'invalid' });
    expect(await countReviews()).toBe(total);
  });

  const withoutKey = (key: string) => (body: ReviewBody) => {
    const copy = { ...body };

    delete copy[key];

    return copy;
  };

  it.each([
    ['нет consent', withoutKey('consent')],
    ['нет license', withoutKey('license')],
    ['consent: false', (body: ReviewBody) => ({ ...body, consent: false })],
  ])('P5: %s → 400 reason consent, запись осталась приглашением', async (_label, mutate) => {
    const record = await invited();

    const response = await sendReview(mutate(reviewBody(record.code)));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'consent' });

    const saved = await readReview(record.id);

    expect(saved.status).toBe('invited');
    expect(isEmpty(saved.fullName), 'ФИО не записано').toBe(true);
  });

  const REQUIRED_FIELDS = ['fullName', 'signature', 'occupation'] as const;
  const REQUIRED_ANSWERS = ['before', 'process', 'after'] as const;
  const BLANKS = [
    ['пусто', ''],
    ['пробелы', '   '],
  ] as const;

  type Mutation = (body: ReviewBody) => ReviewBody;

  const FIELD_ROWS: [string, Mutation][] = [
    ...REQUIRED_FIELDS.flatMap((field) =>
      BLANKS.map(([label, value]): [string, Mutation] => [
        `${field}: ${label}`,
        (body) => ({ ...body, [field]: value }),
      ]),
    ),
    ...REQUIRED_ANSWERS.flatMap((answer) =>
      BLANKS.map(([label, value]): [string, Mutation] => [
        `answers.${answer}: ${label}`,
        (body) => ({ ...body, answers: { ...body.answers, [answer]: value } }),
      ]),
    ),
    ['locale: de', (body) => ({ ...body, locale: 'de' })],
    ['нет locale', withoutKey('locale')],
  ];

  it.each(FIELD_ROWS)('P6: %s → 400 reason fields, запись осталась приглашением', async (_label, mutate) => {
    const record = await invited();

    const response = await sendReview(mutate(reviewBody(record.code)));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'fields' });

    const saved = await readReview(record.id);

    expect(saved.status).toBe('invited');
    expect(isEmpty(saved.fullName), 'ФИО не записано').toBe(true);
  });

  it('P7: пустая ссылка — успех; ссылка javascript: — 400 reason fields', async () => {
    const withoutLink = await invited();
    const response = await sendReview(reviewBody(withoutLink.code, { link: '' }));

    expect(response.status).toBe(200);
    expect((await readReview(withoutLink.id)).status).toBe('received');

    const withScript = await invited();
    const rejected = await sendReview(reviewBody(withScript.code, { link: 'javascript:alert(1)' }));

    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({ ok: false, reason: 'fields' });
    expect((await readReview(withScript.id)).status).toBe('invited');
  });

  const LINK_PREFIX = 'https://example.com/';

  const LENGTH_ROWS: [string, number, Mutation][] = [
    ['fullName 201 символ', 400, (body) => ({ ...body, fullName: 'Я'.repeat(201) })],
    ['ответ 4001 символ', 400, (body) => ({ ...body, answers: { ...body.answers, process: 'о'.repeat(4001) } })],
    ['link 501 символ', 400, (body) => ({ ...body, link: LINK_PREFIX + 'a'.repeat(501 - LINK_PREFIX.length) })],
    ['other 501 символ', 400, (body) => ({ ...body, restrictions: { ...body.restrictions, other: 'д'.repeat(501) } })],
    [
      'ответ ровно 4000 символов',
      200,
      (body) => ({ ...body, answers: { ...body.answers, process: 'о'.repeat(4000) } }),
    ],
  ];

  it.each(LENGTH_ROWS)('P8: %s → %i', async (_label, status, mutate) => {
    const record = await invited();

    const response = await sendReview(mutate(reviewBody(record.code)));

    expect(response.status).toBe(status);
    expect((await readReview(record.id)).status).toBe(status === 200 ? 'received' : 'invited');

    if (status === 400) {
      expect(await response.json()).toMatchObject({ ok: false, reason: 'fields' });
    }
  });

  it('P9: тело не JSON → 400 без исключения', async () => {
    const response = await sendReview('{"code": не json');

    expect(response.status).toBe(400);
  });

  it('P10: русская страница → тексты документов на русском', async () => {
    const record = await invited({ inviteLocale: 'en' });

    expect((await sendReview(reviewBody(record.code, { locale: 'ru' }))).status).toBe(200);

    const saved = await readReview(record.id);
    const documents = reviewDocuments('ru');

    expect(saved.locale).toBe('ru');
    expect(saved.consentText).toBe(documents.consent);
    expect(saved.licenseText).toBe(documents.license);
    expect(saved.consentText).toContain('Согласие');
    expectDocumentItems(saved, 'ru');
  });
});

describe('уведомление о новом отзыве', () => {
  it('C1: после принятого отзыва в Telegram ровно одно сообщение с проектом и ссылкой на запись, без ПД', async () => {
    const record = await invited();

    expect((await sendReview(reviewBody(record.code))).status).toBe(200);

    await vi.waitFor(() => expect(telegram.calls.length).toBeGreaterThan(0), { timeout: 5000 });
    await settle();

    expect(telegram.calls).toHaveLength(1);

    const [{ chatId, text }] = telegram.calls;

    expect(chatId).toBe(TELEGRAM_CHAT);
    expect(text).toContain(record.project);
    expect(text).toContain(`/admin/collections/reviews/${record.id}`);

    for (const [name, value] of [
      ['ФИО', AUTHOR.fullName],
      ['подпись', AUTHOR.signature],
      ['дело', AUTHOR.occupation],
      ['ссылка', AUTHOR.link],
      ['ответ «с чем пришли»', AUTHOR.answers.before],
      ['ответ «как шла работа»', AUTHOR.answers.process],
      ['ответ «что изменилось»', AUTHOR.answers.after],
      ['почта', record.email ?? ''],
    ]) {
      expect(text, `в уведомлении нет поля «${name}»`).not.toContain(value);
    }
  });

  it('C2: Telegram ответил 500 — клиенту 200, отзыв записан', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    telegram.status = 500;

    const record = await invited();
    const response = await sendReview(reviewBody(record.code));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await readReview(record.id)).toMatchObject({
      status: 'received',
      fullName: AUTHOR.fullName,
      signature: AUTHOR.signature,
      answers: AUTHOR.answers,
    });

    await vi.waitFor(() => expect(telegram.calls.length).toBeGreaterThan(0), { timeout: 5000 });
  });

  it('C3: отказы (повтор, срок, неизвестный код, без отметки, без поля) в Telegram не уходят', async () => {
    const used = await invited();

    expect((await sendReview(reviewBody(used.code))).status).toBe(200);

    await vi.waitFor(() => expect(telegram.calls.length).toBeGreaterThan(0), { timeout: 5000 });
    await settle();
    telegram.calls.length = 0;

    const now = Date.now();
    const expired = await invited({ sentAt: iso(now - 61 * DAY_MS), expiresAt: iso(now - DAY_MS) });
    const withoutConsent = await invited();
    const withoutField = await invited();

    const statuses = [
      (await sendReview(reviewBody(used.code))).status,
      (await sendReview(reviewBody(expired.code))).status,
      (await sendReview(reviewBody(uniqueCode()))).status,
      (await sendReview(reviewBody(withoutConsent.code, { consent: false }))).status,
      (await sendReview(reviewBody(withoutField.code, { occupation: '' }))).status,
    ];

    await settle();

    expect(statuses).toEqual([409, 404, 404, 400, 400]);
    expect(telegram.calls).toEqual([]);
  });
});

describe('отправка приглашения', () => {
  let adminToken: string;
  let editorToken: string;

  beforeAll(async () => {
    adminToken = await loginAs(admin);
    editorToken = await loginAs(editor);
  });

  /** Письмо одной записи: адрес получателя — почта клиента из приглашения. */
  const mailsTo = (email: string | undefined) => mails.filter(({ to }) => to.includes(email ?? ''));

  it('I1: администратор отправляет приглашение на английском — письмо клиенту со ссылкой, срок 60 суток', async () => {
    const record = await unsent('en', { project: 'Northwind Bakery' });

    const before = Date.now();
    const response = await sendInvite({ id: record.id, action: 'send' }, adminToken);
    const after = Date.now();

    expect(response.status).toBe(200);

    const saved = await readReview(record.id);

    expect(saved.code).toMatch(/\S/);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toEqual([record.email]);
    expect(mails[0].text).toContain(`/en/review/${saved.code}`);
    expect(mails[0].text).toContain('Northwind Bakery');
    expect(CYRILLIC.test(mails[0].text), 'в английском письме нет кириллицы').toBe(false);
    expect(Date.parse(saved.sentAt ?? '')).toBeGreaterThanOrEqual(before);
    expect(Date.parse(saved.sentAt ?? '')).toBeLessThanOrEqual(after);
    expect(Date.parse(saved.expiresAt ?? '') - Date.parse(saved.sentAt ?? '')).toBe(INVITE_TTL_MS);
  });

  it('I2: приглашение на русском — ссылка /ru/review/<код>, текст по-русски', async () => {
    const record = await unsent('ru', { project: 'Southwind Bakery' });

    const before = Date.now();
    const response = await sendInvite({ id: record.id, action: 'send' }, adminToken);
    const after = Date.now();

    expect(response.status).toBe(200);

    const saved = await readReview(record.id);

    expect(saved.code).toMatch(/\S/);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toEqual([record.email]);
    expect(mails[0].text).toContain(`/ru/review/${saved.code}`);
    expect(mails[0].text).toContain('Southwind Bakery');
    expect(CYRILLIC.test(mails[0].text), 'в русском письме есть кириллица').toBe(true);
    expect(Date.parse(saved.sentAt ?? '')).toBeGreaterThanOrEqual(before);
    expect(Date.parse(saved.sentAt ?? '')).toBeLessThanOrEqual(after);
    expect(Date.parse(saved.expiresAt ?? '') - Date.parse(saved.sentAt ?? '')).toBe(INVITE_TTL_MS);
  });

  it('I3: у 20 приглашений коды разные, из алфавита base64url или hex, не меньше 128 бит', async () => {
    const codes: string[] = [];

    for (let index = 0; index < 20; index += 1) {
      const record = await unsent(index % 2 ? 'ru' : 'en');

      expect((await sendInvite({ id: record.id, action: 'send' }, adminToken)).status).toBe(200);
      codes.push((await readReview(record.id)).code ?? '');
    }

    expect(new Set(codes).size).toBe(20);

    for (const code of codes) {
      const bits = code.length * (/^[0-9a-f]+$/.test(code) ? 4 : 6);

      expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(bits, `код «${code}»`).toBeGreaterThanOrEqual(128);
    }
  });

  it('I4: повторная отправка → 409, второго письма нет, код и срок прежние', async () => {
    const record = await unsent('ru');

    expect((await sendInvite({ id: record.id, action: 'send' }, adminToken)).status).toBe(200);

    const sent = await readReview(record.id);
    const response = await sendInvite({ id: record.id, action: 'send' }, adminToken);

    expect(response.status).toBe(409);
    expect(mailsTo(record.email)).toHaveLength(1);

    const saved = await readReview(record.id);

    expect(saved.code).toBe(sent.code);
    expect(saved.expiresAt).toBe(sent.expiresAt);
  });

  it('I5: продление ставит срок «сейчас + 60 суток» и шлет второе письмо с той же ссылкой; у полученного — 409', async () => {
    const record = await unsent('ru');

    expect((await sendInvite({ id: record.id, action: 'send' }, adminToken)).status).toBe(200);

    const sent = await readReview(record.id);

    await payload.update({
      collection: REVIEWS,
      id: record.id,
      data: { expiresAt: iso(Date.now() - 10 * DAY_MS) } as never,
    });

    const before = Date.now();
    const response = await sendInvite({ id: record.id, action: 'renew' }, adminToken);
    const after = Date.now();

    expect(response.status).toBe(200);

    const renewed = await readReview(record.id);
    const letters = mailsTo(record.email);

    expect(renewed.code).toBe(sent.code);
    expect(Date.parse(renewed.expiresAt ?? '')).toBeGreaterThanOrEqual(before + INVITE_TTL_MS);
    expect(Date.parse(renewed.expiresAt ?? '')).toBeLessThanOrEqual(after + INVITE_TTL_MS);
    expect(letters).toHaveLength(2);
    expect(letters[1].text).toContain(`/ru/review/${sent.code}`);

    const done = await received();
    const mailCount = mails.length;
    const refused = await sendInvite({ id: done.id, action: 'renew' }, adminToken);

    expect(refused.status).toBe(409);
    expect(mails).toHaveLength(mailCount);
  });

  it.each([
    ['без входа', 'send'],
    ['без входа', 'renew'],
    ['редактор', 'send'],
    ['редактор', 'renew'],
  ] as const)('I6: %s, %s → 403, писем нет, запись не изменилась', async (who, action) => {
    const record = action === 'send' ? await unsent('ru') : await invited();
    const before = await readReview(record.id);

    const response = await sendInvite({ id: record.id, action }, who === 'редактор' ? editorToken : undefined);

    expect(response.status).toBe(403);
    expect(mails).toEqual([]);
    expect(await readReview(record.id)).toEqual(before);
  });

  it('I7: SMTP недоступен → 502 reason mail, код и сроки не записаны', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.SMTP_URL = `smtp://127.0.0.1:${await closedPort()}`;

    const record = await unsent('ru');
    const response = await sendInvite({ id: record.id, action: 'send' }, adminToken);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'mail' });

    const saved = await readReview(record.id);

    expect(isEmpty(saved.sentAt), 'sentAt пуст').toBe(true);
    expect(isEmpty(saved.expiresAt), 'expiresAt пуст').toBe(true);
    expect(isEmpty(saved.code), 'code пуст').toBe(true);
  });

  it('I8: несуществующий id → 404', async () => {
    const response = await sendInvite({ id: 987_654_321, action: 'send' }, adminToken);

    expect(response.status).toBe(404);
    expect(mails).toEqual([]);
  });

  it('I9: код из ссылки письма открывает форму: getReviewState отдает только вид и проект', async () => {
    const record = await unsent('en', { project: 'Eastwind Bakery' });

    expect((await sendInvite({ id: record.id, action: 'send' }, adminToken)).status).toBe(200);
    expect(mails).toHaveLength(1);

    const code = mails[0].text.match(/\/en\/review\/([A-Za-z0-9_-]+)/)?.[1] ?? '';
    const state = await getReviewState(code);

    expect(code).toBe((await readReview(record.id)).code);
    expect(Object.keys(state).sort()).toEqual(['project', 'view']);
    expect(state).toEqual({ view: 'form', project: 'Eastwind Bakery' });
  });
});

describe('отзыв согласия', () => {
  /** Администратор переводит полученный отзыв в «согласие отозвано» через Local API со своими правами. */
  const withdraw = async () => {
    const record = await received();

    const before = Date.now();

    await payload.update({
      collection: REVIEWS,
      id: record.id,
      data: { status: 'withdrawn' } as never,
      overrideAccess: false,
      user: admin,
    });

    const after = Date.now();

    return { record, before, after, saved: await readReview(record.id) };
  };

  it('E1: «согласие отозвано» стирает ФИО, подпись, дело, ссылку, ответы, перевод и «другое»; проект, почта, даты и отметки запретов остаются', async () => {
    const { record, before, after, saved } = await withdraw();

    expect(saved.status).toBe('withdrawn');
    expect(
      {
        fullName: isEmpty(saved.fullName),
        signature: isEmpty(saved.signature),
        occupation: isEmpty(saved.occupation),
        link: isEmpty(saved.link),
        before: isEmpty(saved.answers?.before),
        process: isEmpty(saved.answers?.process),
        after: isEmpty(saved.answers?.after),
        translation: isEmpty(saved.translation?.text),
        other: isEmpty(saved.restrictions?.other),
      },
      'поля стерты',
    ).toEqual({
      fullName: true,
      signature: true,
      occupation: true,
      link: true,
      before: true,
      process: true,
      after: true,
      translation: true,
      other: true,
    });
    expect(saved.translation?.approved ?? false).toBe(false);
    expect(saved.restrictions, 'отметки запретов остаются').toMatchObject({
      noTransfer: RESTRICTIONS.noTransfer,
      noLink: RESTRICTIONS.noLink,
    });
    expect(saved).toMatchObject({
      project: record.project,
      email: record.email,
      createdAt: record.createdAt,
      consentAt: record.consentAt,
    });
    expect(Date.parse(saved.withdrawnAt ?? '')).toBeGreaterThanOrEqual(before);
    expect(Date.parse(saved.withdrawnAt ?? '')).toBeLessThanOrEqual(after);
  });

  it('E2: страница с кодом отозванного отзыва — «ссылка недействительна», как у неизвестного кода', async () => {
    const { record } = await withdraw();

    const state = await getReviewState(record.code ?? '');

    expect(state).toStrictEqual({ view: 'invalid' });
    expect(state).toStrictEqual(await getReviewState(uniqueCode()));
  });

  it('E3: отзыв по коду с отозванным согласием → 404', async () => {
    const { record } = await withdraw();

    const response = await sendReview(reviewBody(record.code));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'invalid' });
  });
});

describe('меню и кнопки админки', () => {
  const IMPORT_MAP = join(import.meta.dirname, '..', '..', 'src', 'app', '(payload)', 'admin', 'importMap.js');

  /** Ключ компонента в карте импорта Payload: путь и имя экспорта через `#`, без имени — `default`. */
  const importKeyOf = (component: unknown): string[] => {
    if (typeof component === 'string') {
      return [component.includes('#') ? component : `${component}#default`];
    }

    if (Array.isArray(component)) {
      return component.flatMap(importKeyOf);
    }

    if (component && typeof component === 'object') {
      const { path, exportName } = component as { path?: unknown; exportName?: unknown };

      if (typeof path === 'string') {
        const [file, named] = path.split('#', 2);

        return [`${file}#${typeof exportName === 'string' ? exportName : (named ?? 'default')}`];
      }

      return Object.values(component).flatMap(importKeyOf);
    }

    return [];
  };

  it('F1: коллекция скрыта из меню у редактора и видна администратору', () => {
    const hidden = Reviews.admin?.hidden;
    const hiddenFor = (role: Role) =>
      typeof hidden === 'function'
        ? hidden({ user: { id: 1, email: `${role}@example.com`, role, collection: 'users' } as never })
        : hidden;

    expect(hiddenFor(Role.Editor)).toBe(true);
    expect(hiddenFor(Role.Admin)).toBe(false);
  });

  it('F2: компонент кнопки приглашения из Reviews.admin.components есть в importMap.js', () => {
    const keys = importKeyOf(Reviews.admin?.components);
    const buttons = keys.filter((key) => key.includes('ReviewInviteButton'));
    const importMap = readFileSync(IMPORT_MAP, 'utf8');

    expect(buttons, 'кнопка в Reviews.admin.components').not.toEqual([]);
    expect(buttons.filter((key) => !importMap.includes(`"${key}":`))).toEqual([]);
  });
});
