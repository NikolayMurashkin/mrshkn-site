import { PRICING_TIERS } from '@/content/pricing';
import { BRIEF_EMPTY_ANSWERS } from './consts';
import type { BriefAnswers, InitialBriefAnswersParams } from './types';

/** Вариант тарифа на первом шаге отдельным ответом не показывается — выбирается его тариф. */
const productOf = (plan: string | null) => PRICING_TIERS.find((tier) => tier.id === plan)?.planId ?? plan ?? '';

/** Начальные ответы квиза: направление из cookie, тариф и ниша из адреса, если они пришли. */
export const initialBriefAnswers = ({ design, plan, niche }: InitialBriefAnswersParams): BriefAnswers => ({
  ...BRIEF_EMPTY_ANSWERS,
  design,
  product: productOf(plan),
  niche: niche ?? '',
});
