import { expect, test, type Page } from '@playwright/test';
import { DESIGNS, LOCALES, MOBILE_VIEWPORT } from './consts';
import { openDesign } from './open-design';

/** Четыре обещания — текстом, а не картинкой: их проверяет и клиент, и договор. */
const PROMISES = {
  ru: ['4 дня', 'Скорость от 90 из 100', 'Фиксированная', 'Год гарантии'],
  en: ['4 days', 'Speed from 90 out of 100', 'Fixed', 'A one-year warranty'],
} as const;

/** График лендинга: четыре дня, по шагу на день. */
const STEP_DAYS = ['1', '2', '3', '4'] as const;

/** Editorial печатает день словом, и слово должно соответствовать дню шага, а не жить своей жизнью. */
const EDITORIAL_ORDINALS = {
  ru: ['День первый', 'День второй', 'День третий', 'День четвертый'],
  en: ['Day one', 'Day two', 'Day three', 'Day four'],
} as const;

const processOf = (page: Page) => page.getByTestId('process');

test.describe('секция «Как мы делаем сайт за 4 дня»', () => {
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
