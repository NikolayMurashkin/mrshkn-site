import type { Theme } from '@/designs/types';
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, THEME_STORAGE_KEY } from './consts';

const themeStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const secure = () => (window.location.protocol === 'https:' ? '; secure' : '');

export const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

export const hasStoredTheme = () => themeStorage()?.getItem(THEME_STORAGE_KEY) !== null;

export const rememberTheme = (theme: Theme) => {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax${secure()}`;
};

export const forgetStoredTheme = () => {
  themeStorage()?.removeItem(THEME_STORAGE_KEY);
  document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax${secure()}`;
};
