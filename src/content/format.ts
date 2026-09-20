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

export const planHref = (locale: string, plan: PricingPlan) => `/${locale}/${plan.slug}?plan=${plan.id}`;
