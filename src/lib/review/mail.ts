import type { SiteLocale } from '@/i18n/types';
import { SITE_URL } from '@/lib/consts';
import en from '../../../messages/en.json';
import ru from '../../../messages/ru.json';
import type { MailMessage } from '@/lib/delivery/types';
import type { ReviewInviteMailInput, ReviewMailText } from './types';

const MAIL_TEXT: Record<SiteLocale, ReviewMailText> = { ru: ru.review.mail, en: en.review.mail };

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder);

const reviewInviteUrl = (locale: SiteLocale, code: string) => `${SITE_URL}/${locale}/review/${code}`;

/** Письмо-приглашение на языке приглашения: название проекта и личная ссылка на форму. */
export const reviewInviteMail = ({ to, locale, project, code }: ReviewInviteMailInput): MailMessage => {
  const values = { project, link: reviewInviteUrl(locale, code) };
  const { subject, paragraphs } = MAIL_TEXT[locale];

  return {
    to,
    subject: fill(subject, values),
    text: paragraphs.map((paragraph) => fill(paragraph, values)).join('\n\n'),
  };
};
