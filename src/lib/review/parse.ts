import { LOCALES } from '@/i18n/consts';
import type { SiteLocale } from '@/i18n/types';
import { REVIEW_ANSWERS, REVIEW_LIMITS, REVIEW_LINK_PATTERN, REVIEW_REQUIRED_FIELDS } from './consts';
import type { ReviewParseResult, ReviewRestrictions } from './types';

const FIELDS_REJECTED = { ok: false, reason: 'fields' } as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** Строка без пробелов по краям; не строка или длиннее предела — `null`. */
const text = (value: unknown, limit: number) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length <= limit ? trimmed : null;
};

const isSiteLocale = (value: unknown): value is SiteLocale => (LOCALES as readonly unknown[]).includes(value);

/** Ссылка автора: http(s) и разбирается как адрес. `URL.canParse` нет в Safari до 17, поэтому через конструктор. */
export const isReviewLink = (value: string) => {
  if (!REVIEW_LINK_PATTERN.test(value)) {
    return false;
  }

  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
};

const parseRestrictions = (value: unknown): ReviewRestrictions | null => {
  if (value === undefined || value === null) {
    return { noTransfer: false, noLink: false, other: null };
  }

  if (!isRecord(value)) {
    return null;
  }

  const other = value.other === undefined || value.other === null ? '' : text(value.other, REVIEW_LIMITS.other);

  return other === null
    ? null
    : { noTransfer: value.noTransfer === true, noLink: value.noLink === true, other: other || null };
};

/**
 * Тело формы отзыва → проверенный отзыв. Код здесь не проверяется — только что он строка: срок и статус знает база.
 * Поля проверяются раньше отметок, но обе причины дают 400, так что порядок на ответ не влияет.
 */
export const parseReview = (input: unknown): ReviewParseResult => {
  if (!isRecord(input) || typeof input.code !== 'string' || !isSiteLocale(input.locale)) {
    return FIELDS_REJECTED;
  }

  const required = REVIEW_REQUIRED_FIELDS.map((field) => [field, text(input[field], REVIEW_LIMITS.short)] as const);
  const answers = REVIEW_ANSWERS.map(
    (answer) => [answer, isRecord(input.answers) ? text(input.answers[answer], REVIEW_LIMITS.answer) : null] as const,
  );
  const link = input.link === undefined || input.link === null ? '' : text(input.link, REVIEW_LIMITS.link);
  const restrictions = parseRestrictions(input.restrictions);

  if (
    [...required, ...answers].some(([, value]) => !value) ||
    link === null ||
    (link && !isReviewLink(link)) ||
    !restrictions
  ) {
    return FIELDS_REJECTED;
  }

  if (input.consent !== true || input.license !== true) {
    return { ok: false, reason: 'consent' };
  }

  const values = Object.fromEntries(required) as Record<(typeof REVIEW_REQUIRED_FIELDS)[number], string>;

  return {
    ok: true,
    review: {
      ...values,
      code: input.code,
      locale: input.locale,
      link: link || null,
      answers: Object.fromEntries(answers) as Record<(typeof REVIEW_ANSWERS)[number], string>,
      restrictions,
    },
  };
};
