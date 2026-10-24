import type { Money, PriceRange, PricingPlan } from './types';

const NBSP = String.fromCodePoint(0x00a0);
const EN_DASH = '–';

const isEnglish = (locale: string) => locale === 'en';

const groupDigits = (amount: number, separator: string) => String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

const amountOf = (money: Money, locale: string) =>
  isEnglish(locale) ? groupDigits(money.usd, ',') : groupDigits(money.rub, NBSP);

export const formatMoney = (money: Money, locale: string) =>
  isEnglish(locale) ? `$${amountOf(money, locale)}` : `${amountOf(money, locale)}${NBSP}₽`;

export const formatRange = ({ from, to }: PriceRange, locale: string) => {
  if (!to) {
    return formatMoney(from, locale);
  }

  const bounds = `${amountOf(from, locale)}${EN_DASH}${amountOf(to, locale)}`;

  return isEnglish(locale) ? `$${bounds}` : `${bounds}${NBSP}₽`;
};

/**
 * Адрес страницы услуги без префикса языка: его добавляет `Link` из next-intl. Тариф без своей страницы ведет
 * на секцию страницы другой услуги, без `?plan=`.
 */
export const planPath = (plan: PricingPlan) =>
  plan.anchor === undefined ? `/${plan.slug}?plan=${plan.id}` : `/${plan.slug}#${plan.anchor}`;

export const planHref = (locale: string, plan: PricingPlan) => `/${locale}${planPath(plan)}`;

const ruDaysWord = (days: number) => {
  const lastTwo = days % 100;
  const last = days % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return 'дней';
  }

  if (last === 1) {
    return 'день';
  }

  return last >= 2 && last <= 4 ? 'дня' : 'дней';
};

/** Срок в календарных днях: в ru число и слово не разрываются переносом. */
export const formatDays = (days: number, locale: string) =>
  isEnglish(locale) ? `${days} ${days === 1 ? 'day' : 'days'}` : `${days}${NBSP}${ruDaysWord(days)}`;

/** Срок тарифа: из дней тарифа, а у тарифа без дней — строка перевода; перевод читается, только когда нужен. */
export const planTerm = (plan: PricingPlan, locale: string, translatedTerm: () => string) =>
  plan.days === undefined ? translatedTerm() : formatDays(plan.days, locale);
