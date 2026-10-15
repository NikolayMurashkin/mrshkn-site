import type { SiteLocale } from '@/i18n/types';
import type { REVIEW_ANSWERS, REVIEW_REQUIRED_FIELDS, REVIEW_STATUSES } from './consts';

/** Что видит человек по ссылке-приглашению: форму, «отзыв получен» или «ссылка недействительна». */
export type ReviewView = 'form' | 'received' | 'invalid';

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Поля записи отзыва, по которым решается вид страницы приглашения; даты — ISO-строки, как их отдает Payload. */
export type ReviewStateRecord = {
  status: string;
  sentAt?: string | null;
  expiresAt?: string | null;
};

/** Тексты двух документов формы на одном языке и редакция согласия. */
export type ReviewDocuments = {
  version: string;
  consent: string;
  license: string;
};

/** Состояние ссылки для страницы: наружу — только вид и, для формы, название проекта. */
export type ReviewState = {
  view: ReviewView;
  project?: string;
};

export type ReviewRequiredField = (typeof REVIEW_REQUIRED_FIELDS)[number];

export type ReviewAnswer = (typeof REVIEW_ANSWERS)[number];

export type ReviewRestrictions = {
  noTransfer: boolean;
  noLink: boolean;
  other: string | null;
};

/** Отзыв из формы после проверки: строки обрезаны по краям, пустая ссылка — `null`. */
export type ReviewSubmission = Record<ReviewRequiredField, string> & {
  code: string;
  locale: SiteLocale;
  link: string | null;
  answers: Record<ReviewAnswer, string>;
  restrictions: ReviewRestrictions;
};

/** Почему форма не принята до проверки кода: поля или отметки. */
export type ReviewRejection = 'fields' | 'consent';

export type ReviewParseResult = { ok: true; review: ReviewSubmission } | { ok: false; reason: ReviewRejection };

/** Тексты одного документа в переводах. */
export type ReviewDocumentText = {
  title: string;
  summary: string;
  items: string[];
  check: string;
};

/** Письмо-приглашение в переводах: абзацы через пустую строку, `{project}` и `{link}` подставляются при отправке. */
export type ReviewMailText = {
  subject: string;
  paragraphs: string[];
};

/** Кому и о каком проекте письмо-приглашение. */
export type ReviewInviteMailInput = {
  to: string;
  locale: SiteLocale;
  project: string;
  code: string;
};
