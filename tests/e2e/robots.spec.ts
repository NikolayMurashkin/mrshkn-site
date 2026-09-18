import { expect, test } from '@playwright/test';
import { LOCALES, NOINDEX_CONTENT, PREVIEW_BASE_URL, PRODUCTION_BASE_URL } from './consts';

test.describe('индексация зависит от SITE_ENV', () => {
  for (const locale of LOCALES) {
    test(`preview: /${locale} отдает noindex, nofollow`, async ({ page }) => {
      await page.goto(`${PREVIEW_BASE_URL}/${locale}`);

      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', NOINDEX_CONTENT);
    });

    test(`production: /${locale} не запрещает индексацию`, async ({ page }) => {
      await page.goto(`${PRODUCTION_BASE_URL}/${locale}`);

      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    });
  }
});
