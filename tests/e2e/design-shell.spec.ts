import { expect, test, type Page } from '@playwright/test';
import { DESIGN_COOKIE, DESIGNS, PREVIEW_BASE_URL, THEME_STORAGE_KEY, THEMES, VIEWPORT } from './consts';
import type { DesignShape } from './types';

const SHAPES: Record<(typeof DESIGNS)[number], DesignShape> = {
  kinetic: { displayFont: /Unbounded/, textFont: /Golos/, navLinks: 4, headerCta: 'Обсудить проект' },
  terminal: { displayFont: /JetBrains Mono/, textFont: /IBM Plex Sans/, navLinks: 4, headerCta: 'Обсудить проект' },
  pop: { displayFont: /Rubik/, textFont: /Rubik/, navLinks: 4, headerCta: 'Обсудить проект' },
  swiss: { displayFont: /Geologica/, textFont: /Geologica/, navLinks: 4, headerCta: null },
  editorial: { displayFont: /Prata/, textFont: /Onest/, navLinks: 5, headerCta: null },
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
        await expect(page.getByRole('banner')).toHaveScreenshot(`header-${design}-${theme}.png`);
        await expect(page.getByRole('contentinfo')).toHaveScreenshot(`footer-${design}-${theme}.png`);
      });
    }
  }
});
