'use client';

import { useLocale, useTranslations } from 'next-intl';
import { EXTRA_PRICE_PATTERN } from './consts';
import { formatMoney, formatRange, planTerm } from './format';
import { MAX_OPTION } from './pricing';
import type { OptionPriceText, PricedItem, PricingExtra, PricingOption, PricingPlan } from './types';

/** Собирает подпись цены: сумма считается кодом, обвязка «от», «/ мес», «+ … / мес» — переводом.
 * У тарифа период не попадает в цену: срок стоит отдельной колонкой, как на артбордах. */
export const usePriceText = () => {
  const locale = useLocale();
  const t = useTranslations('pricing.price');
  const plans = useTranslations('pricing.plans');

  const plan = (item: PricedItem) => t(item.isFrom ? 'from' : 'exact', { amount: formatMoney(item.price, locale) });

  const option = (item: PricingOption): OptionPriceText => ({
    amount: formatRange(item.price, locale),
    monthly: item.monthly ? t('monthlyAddon', { amount: formatRange(item.monthly, locale) }) : undefined,
  });

  /** Нижняя цена опции с обвязкой «от» — для текстов, где опция названа одной суммой. */
  const optionFrom = (item: PricingOption) => t('from', { amount: formatMoney(item.price.from, locale) });

  const extra = (item: PricingExtra) =>
    t(EXTRA_PRICE_PATTERN[item.period], { amount: formatMoney(item.price, locale) });

  /** Срок тарифа: из дней тарифа, у тарифа «от» — строкой перевода. */
  const term = (item: PricingPlan) => planTerm(item, locale, () => plans(`${item.id}.term`));

  /** Цена опции MAX отраслевого Mini App — подстановка `{max}` в плашке «Telegram и MAX». */
  const max = formatRange(MAX_OPTION.price, locale);

  return { plan, option, optionFrom, extra, term, max };
};
