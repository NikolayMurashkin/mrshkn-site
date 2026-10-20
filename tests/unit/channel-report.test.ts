import { describe, expect, it } from 'vitest';
import { buildChannelReport, currentMonth, formatChannelRow, parsePeriod } from '@/lib/crm/report';
import type { LeadStage } from '@/lib/brief/types';

/**
 * Отчет CRM по каналам рекламы: строка на каждый `utm_source` заявок и расходов периода, заявки без метки — строка
 * «без метки», итог по всем строкам. Счет — чистая функция, экран только выводит отформатированные строки. Период —
 * дни по московскому времени (UTC+3), оба включительно: заявка относится к нему по дате создания, расход — по своей дате.
 */

const OCTOBER = { from: '2026-10-01', to: '2026-10-31' };

const IN_OCTOBER = '2026-10-10T09:00:00.000Z';

const QUALIFIED_AT = '2026-10-12T09:00:00.000Z';

const NOW = new Date('2026-10-15T10:00:00Z');

type LeadInput = {
  createdAt?: string;
  utm_source?: string | null;
  stage?: LeadStage;
  qualifiedAt?: string | null;
  amount?: number | null;
};

const lead = ({ createdAt = IN_OCTOBER, stage = 'new', ...rest }: LeadInput = {}) => ({ createdAt, stage, ...rest });

const qualifiedLead = (utm_source: string | null, rest: LeadInput = {}) =>
  lead({ utm_source, stage: 'qualified', qualifiedAt: QUALIFIED_AT, ...rest });

const expense = (utm_source: string, amount: number, date = IN_OCTOBER) => ({ date, utm_source, amount });

/** Пробелы в ожидаемом тексте — неразрывные U+00A0: разряды и знак валюты не переносятся отдельно от числа. */
const nb = (text: string) => text.replaceAll(' ', ' ');

const rowOf = (report: ReturnType<typeof buildChannelReport>, source: string | null) =>
  report.rows.find((row) => row.source === source);

/** Заявки и расходы двух каналов: на них проверяются и строки, и итог, и форматирование. */
const F1_LEADS = [
  lead({ utm_source: 'yandex' }),
  qualifiedLead('yandex'),
  lead({ utm_source: 'yandex', stage: 'contract', qualifiedAt: QUALIFIED_AT, amount: 100000 }),
  lead({ utm_source: 'vk', stage: 'delivered', qualifiedAt: QUALIFIED_AT, amount: 50000 }),
  lead({ utm_source: 'vk' }),
];

const F1_EXPENSES = [expense('yandex', 6000), expense('yandex', 3000), expense('vk', 4000)];

const ZERO_ROW = {
  leads: 0,
  qualified: 0,
  contracts: 0,
  revenue: 0,
  spend: 0,
};

describe('отчет по каналам: строки', () => {
  it('F1: заявки и расходы двух каналов — заявки, квалифицированные, договоры, выручка, расход, CPL, цена квалифицированной и окупаемость по каждому', () => {
    const report = buildChannelReport(F1_LEADS, F1_EXPENSES, OCTOBER);

    expect(rowOf(report, 'yandex')).toMatchObject({
      source: 'yandex',
      leads: 3,
      qualified: 2,
      contracts: 1,
      revenue: 100000,
      spend: 9000,
      cpl: 3000,
      costPerQualified: 4500,
      overKpi: true,
      payback: 100000 / 9000,
    });
    expect(rowOf(report, 'vk')).toMatchObject({
      source: 'vk',
      leads: 2,
      qualified: 1,
      contracts: 1,
      revenue: 50000,
      spend: 4000,
      cpl: 2000,
      costPerQualified: 4000,
      overKpi: true,
      payback: 12.5,
    });
    expect(report.rows).toHaveLength(2);
  });

  it('F2: квалифицирована → отказ — в квалифицированных, но не в договорах и не в выручке', () => {
    const report = buildChannelReport(
      [lead({ utm_source: 'avito', stage: 'rejected', qualifiedAt: QUALIFIED_AT, amount: 80000 })],
      [],
      OCTOBER,
    );

    expect(rowOf(report, 'avito')).toMatchObject({ leads: 1, qualified: 1, contracts: 0, revenue: 0 });
  });

  it('F3: сумма сделки на этапе «КП» в выручку не входит, заявка — в квалифицированных', () => {
    const report = buildChannelReport(
      [lead({ utm_source: 'avito', stage: 'proposal', qualifiedAt: QUALIFIED_AT, amount: 70000 })],
      [],
      OCTOBER,
    );

    expect(rowOf(report, 'avito')).toMatchObject({ leads: 1, qualified: 1, contracts: 0, revenue: 0 });
  });

  it.each<[LeadStage, number, number]>([
    ['contract', 1, 42000],
    ['work', 1, 42000],
    ['delivered', 1, 42000],
    ['new', 0, 0],
    ['qualified', 0, 0],
    ['proposal', 0, 0],
    ['rejected', 0, 0],
  ])('F4: этап %s — договоры %i, выручка %i', (stage, contracts, revenue) => {
    const report = buildChannelReport([lead({ utm_source: 'avito', stage, amount: 42000 })], [], OCTOBER);

    expect(rowOf(report, 'avito')).toMatchObject({ leads: 1, contracts, revenue });
  });

  it('F5: договор без суммы — договоры 1, выручка 0, не NaN', () => {
    const report = buildChannelReport(
      [lead({ utm_source: 'avito', stage: 'contract', qualifiedAt: QUALIFIED_AT, amount: null })],
      [],
      OCTOBER,
    );

    expect(rowOf(report, 'avito')).toMatchObject({ contracts: 1, revenue: 0 });
    expect(report.total.revenue).toBe(0);
  });

  it('F6: канал с расходом без заявок — строка с нулями, «—» в CPL и цене квалифицированной, окупаемость 0', () => {
    const report = buildChannelReport([], [expense('telegram', 5000)], OCTOBER);

    expect(report.rows).toEqual([
      expect.objectContaining({
        source: 'telegram',
        ...ZERO_ROW,
        spend: 5000,
        cpl: null,
        costPerQualified: null,
        overKpi: false,
        payback: 0,
      }),
    ]);
  });

  it('F7: заявки без utm_source, с null, пустой строкой и пробелами — одна строка «без метки»', () => {
    const report = buildChannelReport(
      [lead(), lead({ utm_source: null }), lead({ utm_source: '' }), lead({ utm_source: '   ' })],
      [],
      OCTOBER,
    );

    expect(report.rows.map((row) => row.source)).toEqual([null]);
    expect(rowOf(report, null)).toMatchObject({ source: null, leads: 4 });
  });

  it('F8: канал с заявками без расхода — CPL и цена квалифицированной 0 ₽, окупаемость пуста (расход 0), превышения нет', () => {
    const report = buildChannelReport(
      [
        qualifiedLead('google'),
        lead({ utm_source: 'google', stage: 'contract', qualifiedAt: QUALIFIED_AT, amount: 10000 }),
      ],
      [],
      OCTOBER,
    );

    expect(rowOf(report, 'google')).toMatchObject({
      leads: 2,
      spend: 0,
      cpl: 0,
      costPerQualified: 0,
      payback: null,
      overKpi: false,
    });
  });

  it('F9: Yandex, « yandex » у заявок и YANDEX у расхода — один канал yandex', () => {
    const report = buildChannelReport(
      [lead({ utm_source: 'Yandex' }), lead({ utm_source: ' yandex ' })],
      [expense('YANDEX', 3000)],
      OCTOBER,
    );

    expect(report.rows).toEqual([expect.objectContaining({ source: 'yandex', leads: 2, spend: 3000 })]);
  });

  it('F10: граница периода по МСК — записи с 01.10 00:00 до 31.10 23:59:59.999 в отчете, соседние — нет; канал вне периода строки не дает', () => {
    const SEPTEMBER_30_LAST_MS = '2026-09-30T20:59:59.999Z';
    const OCTOBER_1_FIRST_MS = '2026-09-30T21:00:00.000Z';
    const OCTOBER_31_LAST_MS = '2026-10-31T20:59:59.999Z';
    const NOVEMBER_1_FIRST_MS = '2026-10-31T21:00:00.000Z';

    const report = buildChannelReport(
      [
        lead({ utm_source: 'yandex', createdAt: SEPTEMBER_30_LAST_MS }),
        lead({ utm_source: 'yandex', createdAt: OCTOBER_1_FIRST_MS }),
        lead({ utm_source: 'yandex', createdAt: OCTOBER_31_LAST_MS }),
        lead({ utm_source: 'yandex', createdAt: NOVEMBER_1_FIRST_MS }),
        lead({ utm_source: 'vk', createdAt: '2026-09-15T09:00:00.000Z' }),
      ],
      [
        expense('yandex', 1, SEPTEMBER_30_LAST_MS),
        expense('yandex', 10, OCTOBER_1_FIRST_MS),
        expense('yandex', 100, OCTOBER_31_LAST_MS),
        expense('yandex', 1000, NOVEMBER_1_FIRST_MS),
        expense('vk', 7000, '2026-11-05T09:00:00.000Z'),
      ],
      OCTOBER,
    );

    expect(report.rows).toEqual([expect.objectContaining({ source: 'yandex', leads: 2, spend: 110 })]);
    expect(report.total).toMatchObject({ leads: 2, spend: 110 });
  });

  it('F11: дата квалификации вне периода, дата создания в периоде — заявка квалифицирована', () => {
    const report = buildChannelReport(
      [lead({ utm_source: 'avito', stage: 'qualified', qualifiedAt: '2026-11-20T10:00:00.000Z' })],
      [],
      OCTOBER,
    );

    expect(rowOf(report, 'avito')).toMatchObject({ leads: 1, qualified: 1 });
  });

  it('F12: порядок строк — по заявкам, затем по расходу, затем по имени; «без метки» последней', () => {
    const report = buildChannelReport(
      [
        lead({ utm_source: 'google' }),
        lead({ utm_source: 'yandex' }),
        ...Array.from({ length: 5 }, () => lead()),
        ...Array.from({ length: 3 }, () => lead({ utm_source: 'vk' })),
      ],
      [expense('yandex', 5000)],
      OCTOBER,
    );

    expect(report.rows.map((row) => row.source)).toEqual(['vk', 'yandex', 'google', null]);
  });

  it('F13: итог — суммы столбцов, CPL, цена квалифицированной и окупаемость от сумм, превышение от суммарной цены', () => {
    const report = buildChannelReport([...F1_LEADS, lead()], [...F1_EXPENSES, expense('telegram', 5000)], OCTOBER);

    expect(report.total).toMatchObject({
      source: null,
      leads: 6,
      qualified: 3,
      contracts: 2,
      revenue: 150000,
      spend: 18000,
      cpl: 3000,
      costPerQualified: 6000,
      overKpi: true,
      payback: 150000 / 18000,
    });
  });

  it('F14: нет заявок и расходов — строк нет, итог с нулями и пустыми CPL, ценой и окупаемостью', () => {
    expect(buildChannelReport([], [], OCTOBER)).toEqual({
      rows: [],
      total: expect.objectContaining({
        source: null,
        ...ZERO_ROW,
        cpl: null,
        costPerQualified: null,
        overKpi: false,
        payback: null,
      }),
    });
  });
});

describe('отчет по каналам: превышение KPI квалифицированной заявки (3 000 ₽)', () => {
  it('K1: 3 001 ₽ за квалифицированную — превышение', () => {
    const report = buildChannelReport([qualifiedLead('avito')], [expense('avito', 3001)], OCTOBER);

    expect(rowOf(report, 'avito')).toMatchObject({ qualified: 1, costPerQualified: 3001, overKpi: true });
  });

  it('K2: 3 000 ₽ за квалифицированную — не превышение', () => {
    const report = buildChannelReport([qualifiedLead('avito')], [expense('avito', 3000)], OCTOBER);

    expect(rowOf(report, 'avito')).toMatchObject({ qualified: 1, costPerQualified: 3000, overKpi: false });
  });

  it('K3: превышение по цене, округленной до рубля, как на экране — 3 000,33 ₽ нет, 3 000,67 ₽ есть', () => {
    const report = buildChannelReport(
      [
        ...Array.from({ length: 3 }, () => qualifiedLead('avito')),
        ...Array.from({ length: 3 }, () => qualifiedLead('profi')),
      ],
      [expense('avito', 9001), expense('profi', 9002)],
      OCTOBER,
    );

    expect(rowOf(report, 'avito')).toMatchObject({ qualified: 3, costPerQualified: 9001 / 3, overKpi: false });
    expect(rowOf(report, 'profi')).toMatchObject({ qualified: 3, costPerQualified: 9002 / 3, overKpi: true });
  });

  it('K4: расход без квалифицированных — цены нет, превышения нет', () => {
    const report = buildChannelReport([lead({ utm_source: 'avito' })], [expense('avito', 10000)], OCTOBER);

    expect(rowOf(report, 'avito')).toMatchObject({ qualified: 0, costPerQualified: null, overKpi: false });
  });
});

const ROW = {
  source: 'yandex',
  leads: 3,
  qualified: 2,
  contracts: 1,
  revenue: 100000,
  spend: 9000,
  cpl: 3000,
  costPerQualified: 4500,
  overKpi: true,
  payback: 100000 / 9000,
};

describe('отчет по каналам: текст для экрана', () => {
  it('P1: строка канала — счетчики целыми, деньги в рублях с разрядами, окупаемость процентом', () => {
    expect(formatChannelRow(ROW)).toMatchObject({
      source: 'yandex',
      leads: '3',
      qualified: '2',
      contracts: '1',
      revenue: nb('100 000 ₽'),
      spend: nb('9 000 ₽'),
      cpl: nb('3 000 ₽'),
      costPerQualified: nb('4 500 ₽'),
      payback: nb('1 111 %'),
    });
  });

  it('P2: заявки без метки — «без метки», пустые CPL, цена квалифицированной и окупаемость — «—»', () => {
    expect(
      formatChannelRow({
        ...ROW,
        source: null,
        leads: 2,
        qualified: 0,
        contracts: 0,
        revenue: 0,
        spend: 0,
        cpl: null,
        costPerQualified: null,
        overKpi: false,
        payback: null,
      }),
    ).toMatchObject({ source: 'без метки', cpl: '—', costPerQualified: '—', payback: '—' });
  });

  it('P3: нецелые деньги округляются до рубля, окупаемость — до целого процента', () => {
    const cpl = (value: number) => formatChannelRow({ ...ROW, cpl: value }).cpl;
    const payback = (value: number) => formatChannelRow({ ...ROW, payback: value }).payback;

    expect({
      cpl: [cpl(1000 / 3), cpl(2500.5)],
      payback: [payback(3), payback(12.5), payback(0.12345), payback(0)],
    }).toEqual({
      cpl: [nb('333 ₽'), nb('2 501 ₽')],
      payback: [nb('300 %'), nb('1 250 %'), nb('12 %'), nb('0 %')],
    });
  });

  it('P4: длинное имя канала возвращается целиком', () => {
    const source = 'autumn-campaign-clinics-moscow-'.repeat(4).slice(0, 120);

    expect(source).toHaveLength(120);
    expect(formatChannelRow({ ...ROW, source }).source).toBe(source);
  });
});

describe('отчет по каналам: период', () => {
  it('D1: середина октября — период с 1 по 31 октября', () => {
    expect(currentMonth(NOW)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });

  it('D2: 01.11 00:30 по Москве (31.10 по UTC) — ноябрь; февраль високосного 2028 — по 29-е', () => {
    expect(currentMonth(new Date('2026-10-31T21:30:00Z'))).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(currentMonth(new Date('2028-02-10T12:00:00Z'))).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('D3: оба дня в параметрах — период из параметров', () => {
    expect(parsePeriod({ from: '2026-10-07', to: '2026-10-13' }, NOW)).toEqual({
      from: '2026-10-07',
      to: '2026-10-13',
    });
  });

  it.each<[string, { from?: string; to?: string }]>([
    ['параметров нет', {}],
    ['только начало', { from: '2026-10-07' }],
    ['только конец', { to: '2026-10-13' }],
    ['13-й месяц', { from: '2026-10-07', to: '2026-13-01' }],
    ['30 февраля', { from: '2026-02-30', to: '2026-10-13' }],
    ['не дата', { from: 'abc', to: '2026-10-13' }],
    ['начало позже конца', { from: '2026-10-13', to: '2026-10-07' }],
  ])('D4: %s — текущий месяц', (_case, query) => {
    expect(parsePeriod(query, NOW)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });
});
