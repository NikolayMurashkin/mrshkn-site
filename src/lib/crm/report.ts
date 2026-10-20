import {
  CONTRACT_STAGES,
  DAY_MS,
  EMPTY_VALUE,
  MSK_OFFSET_MS,
  NBSP,
  QUALIFIED_LEAD_KPI_RUB,
  UNMARKED_SOURCE,
} from './consts';
import type {
  ChannelReport,
  ChannelRow,
  ChannelTotals,
  FormattedChannelRow,
  PeriodBounds,
  PeriodQuery,
  ReportExpense,
  ReportLead,
  ReportPeriod,
} from './types';

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

const dayOf = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** Полночь дня `YYYY-MM-DD` по UTC в миллисекундах; несуществующий день (13-й месяц, 30 февраля) — `null`. */
const utcMidnightOf = (day: string) => {
  const match = DAY_PATTERN.exec(day);

  if (!match) {
    return null;
  }

  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  return dayOf(new Date(time)) === day ? time : null;
};

/** Границы периода: от `from` 00:00 по Москве включительно до следующего за `to` дня 00:00 по Москве, не включая. */
export const periodBounds = ({ from, to }: ReportPeriod): PeriodBounds => ({
  start: new Date((utcMidnightOf(from) ?? Number.NaN) - MSK_OFFSET_MS).toISOString(),
  end: new Date((utcMidnightOf(to) ?? Number.NaN) + DAY_MS - MSK_OFFSET_MS).toISOString(),
});

const inBounds = (value: string, { start, end }: PeriodBounds) => {
  const time = Date.parse(value);

  return time >= Date.parse(start) && time < Date.parse(end);
};

export const currentMonth = (now: Date): ReportPeriod => {
  const msk = new Date(now.getTime() + MSK_OFFSET_MS);
  const year = msk.getUTCFullYear();
  const month = msk.getUTCMonth();

  return { from: dayOf(new Date(Date.UTC(year, month, 1))), to: dayOf(new Date(Date.UTC(year, month + 1, 0))) };
};

/** Период из параметров запроса; нет обоих дней, день не существует или начало позже конца — текущий месяц. */
export const parsePeriod = ({ from, to }: PeriodQuery, now: Date): ReportPeriod => {
  const start = from ? utcMidnightOf(from) : null;
  const end = to ? utcMidnightOf(to) : null;

  if (start === null || end === null || start > end) {
    return currentMonth(now);
  }

  return { from: from as string, to: to as string };
};

/** Канал — `utm_source` без регистра и пробелов по краям; пустая метка — заявка без метки. */
const channelOf = (source: string | null | undefined) => source?.trim().toLowerCase() || null;

/** Деление на ноль — пустое значение, а не 0 и не бесконечность. */
const ratio = (numerator: number, denominator: number) => (denominator === 0 ? null : numerator / denominator);

const EMPTY_TOTALS: ChannelTotals = { leads: 0, qualified: 0, contracts: 0, revenue: 0, spend: 0 };

/** Превышение — по цене, округленной до рубля, как ее видно на экране: подсветка и число не расходятся. */
const toRow = (source: string | null, totals: ChannelTotals): ChannelRow => {
  const costPerQualified = ratio(totals.spend, totals.qualified);

  return {
    source,
    ...totals,
    cpl: ratio(totals.spend, totals.leads),
    costPerQualified,
    overKpi: costPerQualified !== null && Math.round(costPerQualified) > QUALIFIED_LEAD_KPI_RUB,
    payback: ratio(totals.revenue, totals.spend),
  };
};

const addTotals = (a: ChannelTotals, b: ChannelTotals): ChannelTotals => ({
  leads: a.leads + b.leads,
  qualified: a.qualified + b.qualified,
  contracts: a.contracts + b.contracts,
  revenue: a.revenue + b.revenue,
  spend: a.spend + b.spend,
});

const leadTotals = ({ stage, qualifiedAt, amount }: ReportLead): ChannelTotals => {
  const contract = CONTRACT_STAGES.includes(stage);

  return {
    leads: 1,
    qualified: qualifiedAt ? 1 : 0,
    contracts: contract ? 1 : 0,
    revenue: contract ? (amount ?? 0) : 0,
    spend: 0,
  };
};

/** Строки по заявкам, затем по расходу, затем по имени канала; «без метки» — последней. */
const compareRows = (a: ChannelRow, b: ChannelRow) => {
  if (a.source === null || b.source === null) {
    return Number(a.source === null) - Number(b.source === null);
  }

  return b.leads - a.leads || b.spend - a.spend || a.source.localeCompare(b.source);
};

/**
 * Отчет по каналам за период: заявка попадает в него по дате создания, расход — по своей дате. Квалифицированная —
 * с датой квалификации на любом этапе, в том числе «отказ»: KPI меряет качество канала, а не исход сделки.
 */
export const buildChannelReport = (
  leads: ReportLead[],
  expenses: ReportExpense[],
  period: ReportPeriod,
): ChannelReport => {
  const bounds = periodBounds(period);
  const channels = new Map<string | null, ChannelTotals>();

  const add = (source: string | null, totals: ChannelTotals) => {
    channels.set(source, addTotals(channels.get(source) ?? EMPTY_TOTALS, totals));
  };

  for (const lead of leads) {
    if (inBounds(lead.createdAt, bounds)) {
      add(channelOf(lead.utm_source), leadTotals(lead));
    }
  }

  for (const expense of expenses) {
    if (inBounds(expense.date, bounds)) {
      add(channelOf(expense.utm_source), { ...EMPTY_TOTALS, spend: expense.amount });
    }
  }

  const rows = [...channels].map(([source, totals]) => toRow(source, totals)).sort(compareRows);

  return { rows, total: toRow(null, [...channels.values()].reduce(addTotals, EMPTY_TOTALS)) };
};

const groupDigits = (value: number) => String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

/** Сумма в целых рублях с разрядами: `9 000 ₽`; пустое значение — «—». */
export const formatRub = (value: number | null) => (value === null ? EMPTY_VALUE : `${groupDigits(value)}${NBSP}₽`);

const formatPercent = (value: number | null) => (value === null ? EMPTY_VALUE : `${groupDigits(value * 100)}${NBSP}%`);

/** Строка отчета текстом для экрана: деньги — целые рубли, окупаемость — процент от расхода, пустое — «—». */
export const formatChannelRow = (row: ChannelRow): FormattedChannelRow => ({
  source: row.source ?? UNMARKED_SOURCE,
  leads: String(row.leads),
  qualified: String(row.qualified),
  contracts: String(row.contracts),
  revenue: formatRub(row.revenue),
  spend: formatRub(row.spend),
  cpl: formatRub(row.cpl),
  costPerQualified: formatRub(row.costPerQualified),
  payback: formatPercent(row.payback),
});
