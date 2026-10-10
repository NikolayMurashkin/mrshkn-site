import { DEFAULT_LOCALE, LOCALES } from '@/i18n/consts';
import type { SiteLocale } from '@/i18n/types';
import { X_DEFAULT } from './consts';

/** Адрес страницы на языке: `path` — без префикса языка, главная — пустая строка. */
export const localePath = (locale: string, path: string) => `/${locale}${path}`;

/**
 * hreflang страницы: ru, en и `x-default` → версия языка по умолчанию. `base` пустой — пути от `metadataBase`
 * (метаданные страниц), `SITE_URL` — абсолютные адреса (карта сайта).
 */
export const languageAlternates = (path: string, base = ''): Record<string, string> => ({
  ...Object.fromEntries(LOCALES.map((locale) => [locale, `${base}${localePath(locale, path)}`])),
  [X_DEFAULT]: `${base}${localePath(DEFAULT_LOCALE, path)}`,
});

/** canonical — эта страница на своем языке, плюс ее языковые версии. */
export const pageAlternates = (locale: SiteLocale, path: string) => ({
  canonical: localePath(locale, path),
  languages: languageAlternates(path),
});
