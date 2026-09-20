import type { Page } from '@playwright/test';
import { DESIGN_COOKIE, PREVIEW_BASE_URL, THEME_STORAGE_KEY, VIEWPORT } from './consts';
import type { OpenDesignOptions } from './types';

/** Открывает главную в заданном направлении: cookie ставится до перехода, тема — до скриптов страницы. */
export const openDesign = async (page: Page, design: string, options: OpenDesignOptions = {}) => {
  const { theme = 'dark', locale = 'ru', viewport = VIEWPORT } = options;

  await page.setViewportSize(viewport);
  await page.context().addCookies([{ name: DESIGN_COOKIE, value: design, url: PREVIEW_BASE_URL }]);
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    THEME_STORAGE_KEY,
    theme,
  ] as const);
  await page.goto(`/${locale}`);
  await page.evaluate(() => document.fonts.ready);
};
