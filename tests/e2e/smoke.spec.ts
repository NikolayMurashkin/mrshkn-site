import { expect, test } from '@playwright/test';
import { LOCALES, PREVIEW_BASE_URL } from './consts';

test.describe('скелет сайта', () => {
  for (const locale of LOCALES) {
    test(`/${locale} отдает 200 и lang="${locale}"`, async ({ page }) => {
      const response = await page.goto(`/${locale}`);

      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
    });
  }

  test('переключатель темы меняет data-theme', async ({ page }) => {
    await page.goto('/ru');
    const html = page.locator('html');
    const themeBefore = await html.getAttribute('data-theme');

    await page.getByTestId('theme-toggle').click();

    await expect(html).not.toHaveAttribute('data-theme', String(themeBefore));
    await expect(html).toHaveAttribute('data-theme', /^(light|dark)$/);
  });

  test('переключатель языка ведет на вторую локаль', async ({ page }) => {
    await page.goto('/ru');

    await page.getByTestId('locale-en').click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  for (const { acceptLanguage, expected } of [
    { acceptLanguage: 'ru-RU', expected: 'ru' },
    { acceptLanguage: 'en-US', expected: 'en' },
  ]) {
    test(`/ с Accept-Language ${acceptLanguage} редиректит на /${expected}`, async ({ browser }) => {
      const context = await browser.newContext({ baseURL: PREVIEW_BASE_URL, locale: acceptLanguage });
      const page = await context.newPage();

      await page.goto('/');

      expect(new URL(page.url()).pathname).toBe(`/${expected}`);
      await context.close();
    });
  }

  test('главная рендерит Hero дефолтного направления', async ({ page }) => {
    await page.goto('/ru');

    await expect(page.locator('html')).toHaveAttribute('data-design', 'kinetic');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('14 дней');
  });
});
