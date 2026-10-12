import type { PricePeriod } from './types';

/** Ключ перевода для подписи позиции прайса вне таблицы тарифов: у нее нет колонки со сроком. */
export const EXTRA_PRICE_PATTERN: Record<PricePeriod, string> = {
  once: 'exact',
  month: 'month',
  hour: 'hour',
};

/** Опции, которые показываются на странице услуги: то, что уже входит в тариф, опцией не предлагается. */
export const SERVICE_OPTIONS: Record<string, readonly string[]> = {
  landing: ['booking', 'payments', 'quiz', 'calculator', 'blog', 'crm'],
  business: ['booking', 'payments', 'quiz', 'calculator', 'reviews', 'assistant', 'branches', 'geo'],
  miniApp: ['catalog', 'crm', 'reviews', 'assistant', 'language'],
  store: ['crm', 'reviews', 'assistant', 'language', 'blog', 'messengers', 'geo'],
  mvp: ['crm', 'assistant', 'language', 'messengers'],
  support: ['geo', 'reviews', 'assistant'],
};

/** Якорь полного списка опций на главной. */
export const SERVICE_PRICES_ANCHOR = 'prices';

/** Якорь секции услуг на главной: страница услуги ведет «назад» к ней. */
export const SERVICE_BACK_ANCHOR = 'services';
