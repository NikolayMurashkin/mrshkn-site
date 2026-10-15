import { REVIEW_LIMITS } from '@/lib/review/consts';
import type { ReviewFieldName } from './types';

export const REVIEW_EMPTY_VALUES: Record<ReviewFieldName, string> = {
  fullName: '',
  signature: '',
  occupation: '',
  link: '',
  before: '',
  process: '',
  after: '',
  other: '',
};

/** Поля, без которых форма не уходит: все, кроме ссылки и «другого». */
export const REVIEW_REQUIRED: readonly ReviewFieldName[] = [
  'fullName',
  'signature',
  'occupation',
  'before',
  'process',
  'after',
];

export const REVIEW_FIELD_NAMES = Object.keys(REVIEW_EMPTY_VALUES) as ReviewFieldName[];

export const REVIEW_MAX_LENGTH: Record<ReviewFieldName, number> = {
  fullName: REVIEW_LIMITS.short,
  signature: REVIEW_LIMITS.short,
  occupation: REVIEW_LIMITS.short,
  link: REVIEW_LIMITS.link,
  before: REVIEW_LIMITS.answer,
  process: REVIEW_LIMITS.answer,
  after: REVIEW_LIMITS.answer,
  other: REVIEW_LIMITS.other,
};

/** Метки полей для тестов и смоука: `review-full-name`, `review-answer-before`… */
export const REVIEW_TEST_IDS: Record<ReviewFieldName, string> = {
  fullName: 'review-full-name',
  signature: 'review-signature',
  occupation: 'review-occupation',
  link: 'review-link',
  before: 'review-answer-before',
  process: 'review-answer-process',
  after: 'review-answer-after',
  other: 'review-other',
};
