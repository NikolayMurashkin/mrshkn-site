import config from '@payload-config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { Forbidden, getPayload, ValidationError, type CollectionSlug, type Payload } from 'payload';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GET as restGet, POST as restPost } from '@/app/(payload)/api/[...slug]/route';
import { getChannelReport } from '@/cms/channel-report';
import { Role } from '@/cms/consts';
import type { User } from '@/payload-types';

/**
 * Отчет CRM по каналам в админке: данные отчета отдает `GET /api/expenses/report` только вошедшим в админку,
 * строки считаются по заявкам и расходам из базы за период по московскому времени. Расходы по каналам заводят
 * руками администратор и редактор, без входа их не прочитать и не завести. Payload настоящий, REST-обработчики
 * вызываются напрямую, вход — токеном `payload.login`.
 */

const PASSWORD = 'integration-password';

const LEADS = 'leads' as CollectionSlug;

const EXPENSES = 'expenses' as CollectionSlug;

const OCTOBER = { from: '2026-10-01', to: '2026-10-31' };

const OCTOBER_QUERY = `from=${OCTOBER.from}&to=${OCTOBER.to}`;

const IN_OCTOBER = '2026-10-10T09:00:00.000Z';

const IN_SEPTEMBER = '2026-09-15T09:00:00.000Z';

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

type LeadData = {
  utm_source?: string | null;
  stage?: string;
  amount?: number | null;
  createdAt?: string;
};

type ExpenseDoc = {
  id: number | string;
  date?: string | null;
  utm_source?: string | null;
  amount?: number | null;
};

type ReportBody = {
  period?: { from: string; to: string };
  rows?: Record<string, unknown>[];
  total?: Record<string, unknown>;
};

let payload: Payload;
let admin: User;
let editor: User;
let adminToken: string;
let editorToken: string;
let sequence = 0;

const nextId = () => {
  sequence += 1;

  return sequence;
};

const collectionInConfig = (slug: CollectionSlug) =>
  payload.config.collections.some((collection) => collection.slug === slug);

const expectExpensesCollection = () => {
  expect(
    payload.config.collections.map((collection) => collection.slug),
    'коллекции expenses нет в конфиге Payload',
  ).toContain(EXPENSES);
};

const countExpenses = async () => {
  expectExpensesCollection();

  return (await payload.count({ collection: EXPENSES, overrideAccess: true })).totalDocs;
};

/** Заявка в обход прав, как ее положил бы обработчик квиза; дата создания из прошлого — прямо в базе. */
const seedLead = async ({ createdAt, ...data }: LeadData = {}) => {
  const id = nextId();
  const doc = await payload.create({
    collection: LEADS,
    data: { name: `Отчет ${id}`, contact: `+7 900 300-00-${String(id).padStart(2, '0')}`, ...data } as never,
    depth: 0,
    overrideAccess: true,
  });

  if (createdAt) {
    await payload.db.updateOne({ collection: LEADS, id: doc.id, data: { createdAt } });
  }

  return doc;
};

const seedExpense = async (utm_source: string, amount: number, date: string) => {
  expectExpensesCollection();

  return (await payload.create({
    collection: EXPENSES,
    data: { date, utm_source, amount } as never,
    depth: 0,
    overrideAccess: true,
  })) as unknown as ExpenseDoc;
};

type RestHandler = typeof restGet;

type RestOptions = { token?: string; query?: string; body?: unknown };

const callRest = async (handler: RestHandler, method: string, slug: string[], options: RestOptions = {}) => {
  const { token, query, body } = options;
  const response = await handler(
    new NextRequest(`http://localhost/api/${slug.join('/')}${query ? `?${query}` : ''}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { authorization: `JWT ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { params: Promise.resolve({ slug }) },
  );

  return { status: response.status, text: await response.text() };
};

const getReport = (token?: string, query: string | undefined = OCTOBER_QUERY) =>
  callRest(restGet, 'GET', ['expenses', 'report'], { token, query });

const parseReport = (text: string) => JSON.parse(text) as ReportBody;

/** Отказ Local API: ошибка или `null`, если запрос прошел. */
const failureOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => error,
  );

/** День по Москве: расход заводится «только днем», время внутри дня не важно. */
const mskDay = (value: string | null | undefined) =>
  new Date(Date.parse(value ?? '') + MSK_OFFSET_MS).toISOString().slice(0, 10);

/** Текущий месяц по Москве, посчитанный независимо от кода отчета. */
const mskMonth = (now: Date) => {
  const msk = new Date(now.getTime() + MSK_OFFSET_MS);
  const year = msk.getUTCFullYear();
  const month = msk.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const pad = (value: number) => String(value).padStart(2, '0');

  return { from: `${year}-${pad(month + 1)}-01`, to: `${year}-${pad(month + 1)}-${pad(lastDay)}` };
};

/** Октябрьские заявки и расходы двух каналов и сентябрьские записи, которые в отчет за октябрь попасть не должны. */
const seedOctober = async () => {
  await seedLead({ utm_source: 'yandex', createdAt: IN_OCTOBER });
  await seedLead({ utm_source: 'yandex', stage: 'qualified', createdAt: IN_OCTOBER });
  await seedLead({ utm_source: 'vk', stage: 'contract', amount: 60000, createdAt: IN_OCTOBER });
  await seedLead({ createdAt: IN_OCTOBER });
  await seedLead({ utm_source: 'yandex', stage: 'qualified', createdAt: IN_SEPTEMBER });
  await seedExpense('yandex', 4000, IN_OCTOBER);
  await seedExpense('yandex', 9999, IN_SEPTEMBER);
};

/**
 * Строки отчета за октябрь по `seedOctober`. Заявка на этапе «договор» квалифицирована: дату квалификации ставит
 * хук коллекции заявок при создании на любом этапе после «новой».
 */
const OCTOBER_ROWS = [
  {
    source: 'yandex',
    leads: 2,
    qualified: 1,
    contracts: 0,
    revenue: 0,
    spend: 4000,
    cpl: 2000,
    costPerQualified: 4000,
    overKpi: true,
    payback: 0,
  },
  {
    source: 'vk',
    leads: 1,
    qualified: 1,
    contracts: 1,
    revenue: 60000,
    spend: 0,
    cpl: 0,
    costPerQualified: 0,
    payback: null,
  },
  { source: null, leads: 1, qualified: 0, contracts: 0, revenue: 0, spend: 0 },
];

const createUser = (email: string, role: Role) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, role } });

const loginAs = async (user: User) => {
  const { token } = await payload.login({ collection: 'users', data: { email: user.email, password: PASSWORD } });

  return token ?? '';
};

const clear = async () => {
  for (const slug of [LEADS, EXPENSES]) {
    if (collectionInConfig(slug)) {
      await payload.delete({ collection: slug, where: { id: { exists: true } }, overrideAccess: true });
    }
  }
};

beforeAll(async () => {
  payload = await getPayload({ config });

  admin = await createUser('channel-report-admin@example.com', Role.Admin);
  editor = await createUser('channel-report-editor@example.com', Role.Editor);
  adminToken = await loginAs(admin);
  editorToken = await loginAs(editor);
});

afterAll(async () => {
  await payload.destroy();
});

beforeEach(clear);

afterEach(clear);

describe('данные отчета по каналам', () => {
  it('I1: GET /api/expenses/report без входа — отказ 401 или 403, в теле нет строк, каналов и сумм', async () => {
    await seedLead({ utm_source: 'yandex', createdAt: IN_OCTOBER });
    await seedExpense('yandex', 4321, IN_OCTOBER);

    const { status, text } = await getReport();

    expect([401, 403]).toContain(status);
    expect(text).not.toContain('rows');
    expect(text).not.toContain('yandex');
    expect(text).not.toContain('4321');
  });

  it('I2: с входом администратора — строки по заявкам и расходам октября, сентябрьские записи не учтены', async () => {
    await seedOctober();

    const { status, text } = await getReport(adminToken);

    expect(status).toBe(200);

    const body = parseReport(text);

    expect(body.rows).toMatchObject(OCTOBER_ROWS);
    expect(body.total).toMatchObject({ source: null, leads: 4, spend: 4000 });
  });

  it('I3: с входом редактора — те же строки, что у администратора', async () => {
    await seedOctober();

    const asAdmin = await getReport(adminToken);
    const asEditor = await getReport(editorToken);

    expect(asEditor.status).toBe(200);
    expect(parseReport(asEditor.text).rows).toMatchObject(OCTOBER_ROWS);
    expect(parseReport(asEditor.text).rows).toEqual(parseReport(asAdmin.text).rows);
  });

  it('I4: без параметров периода — текущий месяц по Москве, заявка, созданная сейчас, в отчете', async () => {
    await seedLead({ utm_source: 'now-probe' });

    const before = mskMonth(new Date());
    const { status, text } = await getReport(adminToken, undefined);
    const after = mskMonth(new Date());

    expect(status).toBe(200);

    const body = parseReport(text);

    expect([before, after]).toContainEqual(body.period);
    expect(body.rows).toContainEqual(expect.objectContaining({ source: 'now-probe', leads: 1 }));
  });

  it('I5: загрузка отчета без пользователя — отказ Forbidden, а не пустой отчет', async () => {
    await seedOctober();

    const error = await failureOf(getChannelReport({ payload, period: OCTOBER }));

    expect(error).toBeInstanceOf(Forbidden);
  });
});

describe('доступ к расходам по каналам', () => {
  it('I6: REST POST и GET /api/expenses без входа — отказ 401 или 403, записей не прибавилось, сумм в теле нет', async () => {
    await seedExpense('leak-probe', 777777, IN_OCTOBER);

    const before = await countExpenses();
    const created = await callRest(restPost, 'POST', ['expenses'], {
      body: { date: IN_OCTOBER, utm_source: 'intruder', amount: 1000 },
    });

    expect([401, 403]).toContain(created.status);
    expect(await countExpenses()).toBe(before);

    const listed = await callRest(restGet, 'GET', ['expenses']);

    expect([401, 403]).toContain(listed.status);
    expect(listed.text).not.toContain('leak-probe');
    expect(listed.text).not.toContain('777777');
  });

  it('I7: администратор и редактор заводят расход — дата, канал и сумма читаются обратно; без пользователя — отказ', async () => {
    expectExpensesCollection();

    for (const [user, utm_source, amount] of [
      [admin, 'avito', 12500],
      [editor, 'profi', 3400],
    ] as const) {
      const created = (await payload.create({
        collection: EXPENSES,
        data: { date: '2026-10-12T09:00:00.000Z', utm_source, amount } as never,
        depth: 0,
        overrideAccess: false,
        user,
      })) as unknown as ExpenseDoc;
      const read = (await payload.findByID({
        collection: EXPENSES,
        id: created.id,
        depth: 0,
        overrideAccess: false,
        user,
      })) as unknown as ExpenseDoc;

      expect({ day: mskDay(read.date), utm_source: read.utm_source, amount: read.amount }).toEqual({
        day: '2026-10-12',
        utm_source,
        amount,
      });
    }

    const before = await countExpenses();
    const error = await failureOf(
      payload.create({
        collection: EXPENSES,
        data: { date: '2026-10-12T09:00:00.000Z', utm_source: 'anonymous', amount: 100 } as never,
        overrideAccess: false,
      }),
    );

    expect(error).toBeInstanceOf(Forbidden);
    expect(await countExpenses()).toBe(before);
  });

  it('I8: отрицательная сумма или расход без канала — ошибка проверки, записи нет', async () => {
    expectExpensesCollection();

    for (const data of [
      { date: '2026-10-12T09:00:00.000Z', utm_source: 'avito', amount: -1 },
      { date: '2026-10-12T09:00:00.000Z', amount: 1000 },
    ]) {
      const error = await failureOf(
        payload.create({ collection: EXPENSES, data: data as never, overrideAccess: false, user: admin }),
      );

      expect(error, JSON.stringify(data)).toBeInstanceOf(ValidationError);
    }

    expect(await countExpenses()).toBe(0);
  });
});

const OCTOBER_FIRST_MS = '2026-09-30T21:00:00.000Z';

const SEPTEMBER_LAST_MS = '2026-09-30T20:59:59.999Z';

const IMPORT_MAP = join(import.meta.dirname, '..', '..', 'src', 'app', '(payload)', 'admin', 'importMap.js');

/** Ключ карты импорта `файл#экспорт` у компонента конфига: строкой или `{ path, exportName }`. */
const importKeyOf = (component: unknown) => {
  const { path, exportName } =
    typeof component === 'string'
      ? { path: component, exportName: undefined }
      : (component as { path: string; exportName?: string });
  const [file, named] = path.split('#', 2);

  return `${file}#${exportName ?? named ?? 'default'}`;
};

describe('загрузка отчета из базы и экран в админке', () => {
  it('I9: больше 10 заявок и расходов за месяц и записи ровно в 00:00 МСК первого дня — все в отчете, соседняя миллисекунда — нет', async () => {
    for (let index = 0; index < 12; index += 1) {
      await seedLead({ utm_source: 'bulk', createdAt: IN_OCTOBER });
    }

    for (let index = 0; index < 11; index += 1) {
      await seedExpense('bulk', 100, IN_OCTOBER);
    }

    await seedLead({ utm_source: 'edge', createdAt: OCTOBER_FIRST_MS });
    await seedLead({ utm_source: 'edge', createdAt: SEPTEMBER_LAST_MS });
    await seedExpense('edge', 500, OCTOBER_FIRST_MS);
    await seedExpense('edge', 7000, SEPTEMBER_LAST_MS);

    const report = await getChannelReport({ payload, user: admin, period: OCTOBER });

    expect(report.rows).toMatchObject([
      { source: 'bulk', leads: 12, spend: 1100 },
      { source: 'edge', leads: 1, spend: 500 },
    ]);
    expect(report.total).toMatchObject({ leads: 13, spend: 1600 });
  });

  it('I10: экран отчета и пункт меню из config.admin.components есть в importMap.js', () => {
    const { afterNavLinks, views } = payload.config.admin.components as {
      afterNavLinks?: unknown[];
      views?: Record<string, { Component?: unknown }>;
    };
    const keys = [...(afterNavLinks ?? []), ...Object.values(views ?? {}).map((view) => view.Component)]
      .filter(Boolean)
      .map(importKeyOf);
    const importMap = readFileSync(IMPORT_MAP, 'utf8');

    expect(keys).toEqual(
      expect.arrayContaining([
        '/cms/components/ChannelReportNavLink#ChannelReportNavLink',
        '/cms/components/ChannelReportView#ChannelReportView',
      ]),
    );
    expect(keys.filter((key) => !importMap.includes(`"${key}":`))).toEqual([]);
  });
});
