import { BRIEF_EMPTY_ANSWERS } from './consts';
import type { BriefAnswers, InitialBriefAnswersParams } from './types';

/** Начальные ответы квиза: направление из cookie, тариф и ниша из адреса, если они пришли. */
export const initialBriefAnswers = ({ design, plan, niche }: InitialBriefAnswersParams): BriefAnswers => ({
  ...BRIEF_EMPTY_ANSWERS,
  design,
  product: plan ?? '',
  niche: niche ?? '',
});
