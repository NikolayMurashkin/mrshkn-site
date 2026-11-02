'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LEGAL_DOCUMENTS, LEGAL_LOCALE } from '@/lib/legal/consts';
import type { LegalLink } from './types';

/**
 * Ссылки подвала на оферту и памятку «Как мы работаем» — рядом с политикой. Документы есть только на русском →
 * на английских страницах ссылок нет: они вели бы на 404.
 */
export const useLegalLinks = (): LegalLink[] => {
  const locale = useLocale();
  const t = useTranslations('footer');

  if (locale !== LEGAL_LOCALE) {
    return [];
  }

  return [
    { href: LEGAL_DOCUMENTS.offer.href, label: t('offer') },
    { href: LEGAL_DOCUMENTS.howWeWork.href, label: t('howWeWork') },
  ];
};
