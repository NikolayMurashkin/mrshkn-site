import { DEFAULT_LOCALE, LOCALES } from '@/i18n/consts';
import type { SiteLocale } from '@/i18n/types';
import { X_DEFAULT } from './consts';

/** Адрес страницы на языке: `path` — без префикса языка, главная — пустая строка. */
export const localePath = (locale: string, path: string) => `/${locale}${path}`;

/**
 * hreflang страницы: ее языки (по умолчанию ru и en) и `x-default` → версия языка по умолчанию. `base` пустой —
 * пути от `metadataBase` (метаданные страниц), `SITE_URL` — абсолютные адреса (карта сайта). Страница только
 * на русском передает `locales` без en: hreflang не ведет на 404.
 */
export const languageAlternates = (
  path: string,
  base = '',
  locales: readonly SiteLocale[] = LOCALES,
): Record<string, string> => ({
  ...Object.fromEntries(locales.map((locale) => [locale, `${base}${localePath(locale, path)}`])),
  [X_DEFAULT]: `${base}${localePath(DEFAULT_LOCALE, path)}`,
});

/** canonical — эта страница на своем языке, плюс ее языковые версии. */
export const pageAlternates = (locale: SiteLocale, path: string, locales: readonly SiteLocale[] = LOCALES) => ({
  canonical: localePath(locale, path),
  languages: languageAlternates(path, '', locales),
});
