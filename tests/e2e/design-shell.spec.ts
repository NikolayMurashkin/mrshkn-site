import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { DESIGN_COOKIE, DESIGNS, PREVIEW_BASE_URL, THEME_STORAGE_KEY, THEMES, VIEWPORT } from './consts';
import type { DesignShape } from './types';

const SHAPES: Record<(typeof DESIGNS)[number], DesignShape> = {
  kinetic: {
    displayFont: /Unbounded/,
    textFont: /Golos/,
    navLinks: 4,
    headerCta: 'Обсудить проект',
    heroTitle: /Сайт\sна\sкоде\s*за\s14\sдней/,
    heroTitleFont: /Unbounded/,
    heroCtas: ['Рассчитать стоимость', 'Смотреть кейсы'],
    heroMark: 'LIGHTHOUSE 90+',
  },
  terminal: {
    displayFont: /JetBrains Mono/,
    textFont: /IBM Plex Sans/,
    navLinks: 4,
    headerCta: 'Обсудить проект',
    heroTitle: /Сайт\sна\sкоде\s*за\s14\sдней\./,
    heroTitleFont: /IBM Plex Sans/,
    heroCtas: ['./рассчитать-стоимость', './кейсы'],
    heroMark: 'build.log',
  },
  pop: {
    displayFont: /Rubik/,
    textFont: /Rubik/,
    navLinks: 4,
    headerCta: 'Обсудить проект',
    heroTitle: /Сайт\sна\sкоде\s*за\s14\sдней/,
    heroTitleFont: /Rubik/,
    heroCtas: ['Рассчитать стоимость', 'Смотреть кейсы'],
    heroMark: 'в акте приемки',
  },
  swiss: {
    displayFont: /Geologica/,
    textFont: /Geologica/,
    navLinks: 4,
    headerCta: null,
    heroTitle: /Сайт\sна\sкоде\sза\s14\sдней\./,
    heroTitleFont: /Geologica/,
    heroCtas: ['Рассчитать стоимость', 'Смотреть кейсы'],
    heroMark: '01 — Студия',
  },
  editorial: {
    displayFont: /Prata/,
    textFont: /Onest/,
    navLinks: 5,
    headerCta: null,
    heroTitle: /Сайт\sна\sкоде\sза\sдве\sнедели\./,
    heroTitleFont: /Prata/,
    heroCtas: ['Рассчитать стоимость', 'Читать кейсы'],
    heroMark: 'Из договора',
  },
};

const openDesign = async (page: Page, design: string, theme: string) => {
  await page.setViewportSize(VIEWPORT);
  await page.context().addCookies([{ name: DESIGN_COOKIE, value: design, url: PREVIEW_BASE_URL }]);
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    THEME_STORAGE_KEY,
    theme,
  ] as const);
  await page.goto('/ru');
  await page.evaluate(() => document.fonts.ready);
};

const SCREENSHOT = { stylePath: join(__dirname, 'screenshot.css') };

const fontOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((node) => window.getComputedStyle(node).fontFamily);

test.describe('каркас направлений', () => {
  for (const design of DESIGNS) {
    test(`${design}: cookie выбирает направление, шапка и подвал на месте`, async ({ page }) => {
      const shape = SHAPES[design];

      await openDesign(page, design, 'dark');

      await expect(page.locator('html')).toHaveAttribute('data-design', design);

      const header = page.getByRole('banner');
      const footer = page.getByRole('contentinfo');

      await expect(header.getByTestId('brand')).toHaveText(/MRSHKN/i);
      await expect(header.getByRole('navigation').getByRole('link')).toHaveCount(shape.navLinks);
      await expect(header.getByTestId('locale-ru')).toBeVisible();
      await expect(header.getByTestId('locale-en')).toBeVisible();
      await expect(header.getByTestId('theme-toggle')).toBeVisible();
      await expect(header.getByRole('link', { name: 'Обсудить проект' })).toHaveCount(shape.headerCta ? 1 : 0);

      await expect(footer.getByRole('link', { name: /Telegram/ })).toBeVisible();
    });

    test(`${design}: шрифты направления применены`, async ({ page }) => {
      const shape = SHAPES[design];

      await openDesign(page, design, 'dark');

      expect(await fontOf(page, 'body')).toMatch(shape.textFont);
      expect(await fontOf(page, '[data-testid="brand"]')).toMatch(shape.displayFont);
      expect(await fontOf(page, 'h1')).toMatch(shape.heroTitleFont);
    });

    test(`${design}: hero по артборду — заголовок, две кнопки, свой элемент`, async ({ page }) => {
      const shape = SHAPES[design];

      await openDesign(page, design, 'dark');

      const hero = page.getByRole('main').locator('section').first();

      await expect(hero.getByRole('heading', { level: 1 })).toHaveText(shape.heroTitle);
      await expect(hero.getByRole('link', { name: shape.heroCtas[0] })).toBeVisible();
      await expect(hero.getByRole('link', { name: shape.heroCtas[1] })).toBeVisible();
      await expect(hero.getByText(shape.heroMark)).toBeAttached();
    });
  }
});

test.describe('тема по умолчанию', () => {
  for (const { design, theme } of [
    { design: 'kinetic', theme: 'dark' },
    { design: 'terminal', theme: 'dark' },
    { design: 'pop', theme: 'light' },
    { design: 'swiss', theme: 'light' },
    { design: 'editorial', theme: 'light' },
  ] as const) {
    test(`${design} без выбранной темы открывается в ${theme}, как на артборде`, async ({ page }) => {
      await page.context().addCookies([{ name: DESIGN_COOKIE, value: design, url: PREVIEW_BASE_URL }]);

      const response = await page.goto('/ru');

      expect(await response?.text()).toMatch(new RegExp(`<html[^>]*data-theme="${theme}"`));
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    });
  }
});

test.describe('эталоны шапки и подвала', () => {
  test.skip(process.platform !== 'darwin', 'эталоны сняты на macOS, на других платформах не сравниваются');

  for (const design of DESIGNS) {
    for (const theme of THEMES) {
      test(`${design} / ${theme}`, async ({ page }) => {
        await openDesign(page, design, theme);

        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.getByRole('banner')).toHaveScreenshot(`header-${design}-${theme}.png`, SCREENSHOT);
        await expect(page.getByRole('main').locator('section').first()).toHaveScreenshot(
          `hero-${design}-${theme}.png`,
          SCREENSHOT,
        );
        await expect(page.getByRole('contentinfo')).toHaveScreenshot(`footer-${design}-${theme}.png`, SCREENSHOT);
      });
    }
  }
});
