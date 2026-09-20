import type { PricePeriod } from './types';

/** Ключ перевода для подписи позиции прайса вне таблицы тарифов: у нее нет колонки со сроком. */
export const EXTRA_PRICE_PATTERN: Record<PricePeriod, string> = {
  once: 'exact',
  month: 'month',
  hour: 'hour',
};
