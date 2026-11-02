import type { SiteLocale } from '@/i18n/types';
import en from '../../../messages/en.json';
import ru from '../../../messages/ru.json';
import { REVIEW_CONSENT_VERSION } from './consts';
import type { ReviewDocuments, ReviewDocumentText } from './types';

const DOCUMENTS = { ru: ru.review.documents, en: en.review.documents };

/** Номер редакции подставляется сам: `{version}` в переводах — для формы, здесь тот же текст строкой. */
const reviewEdition = (template: string) => template.replace('{version}', REVIEW_CONSENT_VERSION);

/** Пункты нумеруются сквозь оба документа, как в согласии на отзыв: разрешение продолжает номера согласия. */
const documentText = ({ title, intro, items, check }: ReviewDocumentText, edition: string, start: number) =>
  [title, edition, ...(intro ? [intro] : []), ...items.map((item, index) => `${start + index}. ${item}`), check].join(
    '\n\n',
  );

/**
 * Тексты согласия и разрешения на языке страницы, ровно как их видел автор в форме. ФИО и почта в текст
 * не подставляются: после отзыва согласия в записи не должно остаться персональных данных.
 */
export const reviewDocuments = (locale: SiteLocale): ReviewDocuments => {
  const { edition, consent, license } = DOCUMENTS[locale];
  const version = reviewEdition(edition);

  return {
    version: REVIEW_CONSENT_VERSION,
    consent: documentText(consent, version, 1),
    license: documentText(license, version, consent.items.length + 1),
  };
};
