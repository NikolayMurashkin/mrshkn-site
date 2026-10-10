import type { Metadata } from 'next';
import { LOCALES } from '@/i18n/consts';
import { pageAlternates } from './alternates';
import { BRAND_NAME, OG_LOCALES } from './consts';
import type { PageSeo } from './types';

/**
 * Общие метаданные индексируемой страницы: canonical, hreflang, Open Graph и карточка X.
 * Картинку кладет `opengraph-image` сегмента; `twitter` Next дополняет заголовком, описанием и картинкой из Open Graph.
 */
export const pageMetadata = ({ locale, path, title, description }: PageSeo): Metadata => {
  const alternates = pageAlternates(locale, path);

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: 'website',
      siteName: BRAND_NAME,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((item) => item !== locale).map((item) => OG_LOCALES[item]),
      url: alternates.canonical,
      title,
      description,
    },
    twitter: { card: 'summary_large_image' },
  };
};
