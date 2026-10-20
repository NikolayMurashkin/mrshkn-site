/** KPI рекламы студии: квалифицированная заявка не дороже 3 000 ₽, дороже — канал подсвечивается в отчете. */
export const QUALIFIED_LEAD_KPI_RUB = 3000;

/** Период отчета — дни по Москве: она живет в UTC+3 круглый год, без перехода на летнее время. */
export const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Этапы, на которых заявка — договор: их суммы сделок и есть выручка канала. */
export const CONTRACT_STAGES: readonly string[] = ['contract', 'work', 'delivered'];

export const NBSP = String.fromCodePoint(0x00a0);

export const EMPTY_VALUE = '—';

export const UNMARKED_SOURCE = 'без метки';
