export const PREVIEW_PORT = 3100;
export const PRODUCTION_PORT = 3101;

export const PREVIEW_BASE_URL = `http://127.0.0.1:${PREVIEW_PORT}`;
export const PRODUCTION_BASE_URL = `http://127.0.0.1:${PRODUCTION_PORT}`;

export const LOCALES = ['ru', 'en'] as const;

export const NOINDEX_CONTENT = 'noindex, nofollow';

export const DESIGNS = ['kinetic', 'terminal', 'pop', 'swiss', 'editorial'] as const;

export const THEMES = ['light', 'dark'] as const;

export const DESIGN_COOKIE = 'design';

export const THEME_STORAGE_KEY = 'theme';

export const THEME_COOKIE = 'theme';

export const VIEWPORT = { width: 1440, height: 900 };

export const SHORT_VIEWPORT = { width: 1440, height: 600 };
