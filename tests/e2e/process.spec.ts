import { expect, test, type Page } from '@playwright/test';
import { DESIGNS, LOCALES, MOBILE_VIEWPORT } from './consts';
import { openDesign } from './open-design';

/** Четыре обещания D4 — текстом, а не картинкой: их проверяет и клиент, и договор. */
const PROMISES = {
  ru: ['14 дней', 'Lighthouse 90+', 'Фикс', '30 дней гарантии'],
  en: ['14 days', 'Lighthouse 90+', 'Fixed', '30 days of warranty'],
} as const;

const STEP_DAYS = ['1', '3', '10', '14'] as const;

/** Editorial печатает день словом, и слово должно соответствовать дню шага, а не жить своей жизнью. */
const EDITORIAL_ORDINALS = {
  ru: ['День первый', 'День третий', 'День десятый', 'День четырнадцатый'],
  en: ['Day one', 'Day three', 'Day ten', 'Day fourteen'],
} as const;

const processOf = (page: Page) => page.getByTestId('process');

test.describe('секция «Как проходят две недели»', () => {
  for (const design of DESIGNS) {
    for (const locale of LOCALES) {
      test(`${design} / ${locale}: четыре обещания и таймлайн из четырех шагов`, async ({ page }) => {
        await openDesign(page, design, { locale });

        const section = processOf(page);
        const promises = section.getByTestId('promises');

        for (const promise of PROMISES[locale]) {
          await expect(promises).toContainText(promise);
        }

        await expect(promises.getByRole('listitem')).toHaveCount(4);

        const steps = section.getByTestId('steps').getByRole('listitem');

        await expect(steps).toHaveCount(4);

        // Editorial называет дни словами («День первый»), поэтому сам день проверяется атрибутом.
        for (const [index, day] of STEP_DAYS.entries()) {
          await expect(steps.nth(index)).toHaveAttribute('data-day', day);
        }

        if (design === 'editorial') {
          for (const [index, ordinal] of EDITORIAL_ORDINALS[locale].entries()) {
            await expect(steps.nth(index)).toContainText(ordinal);
          }
        }
      });
    }

    test(`${design}: на 320px шаги идут вертикально, без горизонтального скролла`, async ({ page }) => {
      await openDesign(page, design, { viewport: MOBILE_VIEWPORT });

      const steps = processOf(page).getByTestId('steps').getByRole('listitem');

      await expect(steps.first()).toBeVisible();

      const boxes = await steps.evaluateAll((nodes) =>
        nodes.map((node) => ({ left: node.getBoundingClientRect().left, top: node.getBoundingClientRect().top })),
      );

      expect(new Set(boxes.map((box) => box.left)).size).toBe(1);
      expect(boxes.map((box) => box.top)).toEqual([...boxes.map((box) => box.top)].sort((a, b) => a - b));
      expect(await processOf(page).evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
    });
  }
});
