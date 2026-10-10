import { getMessages } from 'next-intl/server';
import { LOCALES } from '@/i18n/consts';
import type { LocaleMessages, SeoMessages } from './types';

/** Тексты всех языков в порядке `LOCALES`: файлы вне `[locale]` собирают разделы обоих языков. */
export const allLocaleMessages = (): Promise<LocaleMessages[]> =>
  Promise.all(
    LOCALES.map(async (locale) => ({ locale, messages: (await getMessages({ locale })) as unknown as SeoMessages })),
  );
