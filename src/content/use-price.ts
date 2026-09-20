'use client';

import { useLocale, useTranslations } from 'next-intl';
import { EXTRA_PRICE_PATTERN } from './consts';
import { formatMoney, formatRange } from './format';
import type { OptionPriceText, PricingExtra, PricingOption, PricingPlan } from './types';

/** Собирает подпись цены: сумма считается кодом, обвязка «от», «/ мес», «+ … / мес» — переводом.
 * У тарифа период не попадает в цену: срок стоит отдельной колонкой, как на артбордах. */
export const usePriceText = () => {
  const locale = useLocale();
  const t = useTranslations('pricing.price');

  const plan = (item: PricingPlan) => t(item.isFrom ? 'from' : 'exact', { amount: formatMoney(item.price, locale) });

  const option = (item: PricingOption): OptionPriceText => ({
    amount: formatRange(item.price, locale),
    monthly: item.monthly ? t('monthlyAddon', { amount: formatRange(item.monthly, locale) }) : undefined,
  });

  const extra = (item: PricingExtra) =>
    t(EXTRA_PRICE_PATTERN[item.period], { amount: formatMoney(item.price, locale) });

  return { plan, option, extra };
};
