import { formatMoney } from '@/content/format';
import type { PricingPlan } from '@/content/types';
import type { PriceTranslate } from './types';

/** Цена тарифа текстом, как в прайсе: сумма — кодом, «от» — переводом. */
export const planPriceText = (translate: PriceTranslate, plan: PricingPlan, locale: string) =>
  translate(plan.isFrom ? 'from' : 'exact', { amount: formatMoney(plan.price, locale) });
