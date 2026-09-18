export const LOCALES = ['ru', 'en'] as const;

export const DEFAULT_LOCALE = 'ru' satisfies (typeof LOCALES)[number];
