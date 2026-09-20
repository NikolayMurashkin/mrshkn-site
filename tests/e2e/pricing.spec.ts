import { expect, test, type Page } from '@playwright/test';
import { DESIGNS, MOBILE_VIEWPORT } from './consts';
import { openDesign } from './open-design';

/** Цена печатается целиком: у тарифов «от» — часть обещания D5, без нее строка прайса меняет смысл. */
const PLAN_ROWS = [
  { id: 'landing', slug: 'landing', name: 'Лендинг «Старт»', priceRu: '100 000 ₽', priceEn: '$2,400' },
  { id: 'business', slug: 'business', name: 'Сайт «Бизнес»', priceRu: '220 000 ₽', priceEn: '$4,500' },
  { id: 'miniApp', slug: 'mini-app', name: 'Telegram-приложение', priceRu: 'от 180 000 ₽', priceEn: 'from $3,500' },
  { id: 'store', slug: 'store', name: 'Интернет-магазин', priceRu: 'от 400 000 ₽', priceEn: 'from $8,000' },
  { id: 'mvp', slug: 'mvp', name: 'MVP «Продукт»', priceRu: 'от 600 000 ₽', priceEn: 'from $12,000' },
  { id: 'support', slug: 'support', name: 'Поддержка', priceRu: 'от 15 000 ₽', priceEn: 'from $250' },
] as const;

/** Заголовок секции: у Editorial по артборду «Оглавление услуг», у остальных — «Услуги и цены». */
const HEADINGS: Record<string, string> = {
  kinetic: 'Услуги и цены',
  terminal: 'Услуги и цены',
  pop: 'Услуги и цены',
  swiss: 'Услуги и цены',
  editorial: 'Оглавление услуг',
};

const pricingOf = (page: Page) => page.getByTestId('pricing');

const documentOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Своего переполнения у секции тоже быть не должно: Pop прячет вынос под `overflow: hidden`. */
const sectionOverflow = (page: Page) => pricingOf(page).evaluate((node) => node.scrollWidth - node.clientWidth);

/** Сколько строк занимает элемент: у инлайнового узла на каждую строку приходится свой прямоугольник. */
const lineBoxes = (nodes: Element[]) => nodes.map((node) => node.getClientRects().length);

/** Сколько колонок образуют элементы: одинаковый правый край — одна колонка прайса. */
const columnsOf = (nodes: Element[]) =>
  new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().right))).size;

/** То же по левому краю: на узком экране группы базы обязаны встать друг под другом. */
const rowsOf = (nodes: Element[]) => new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().left))).size;

test.describe('секция «Услуги и цены»', () => {
  for (const design of DESIGNS) {
    test(`${design}: тарифы с ценами и ссылками на страницы услуг`, async ({ page }) => {
      await openDesign(page, design);

      const pricing = pricingOf(page);

      await expect(pricing.getByRole('heading', { level: 2 })).toHaveText(HEADINGS[design]);

      for (const plan of PLAN_ROWS) {
        const row = pricing.getByTestId(`plan-${plan.id}`);

        await expect(row).toContainText(plan.name);
        await expect(row).toContainText(plan.priceRu);
        await expect(row.getByRole('link')).toHaveAttribute('href', `/ru/${plan.slug}?plan=${plan.id}`);
      }
    });

    test(`${design}: база тарифа, опции и Telegram с MAX за одну цену`, async ({ page }) => {
      await openDesign(page, design);

      const pricing = pricingOf(page);

      await expect(pricing.getByTestId('basics').getByRole('listitem')).toHaveCount(13);
      await expect(pricing.getByTestId('basics-group')).toHaveCount(4);
      await expect(pricing.getByTestId('options').getByRole('listitem')).toHaveCount(13);
      await expect(pricing.getByTestId('options')).toContainText('40 000 ₽');
      await expect(pricing.getByTestId('mini-app-note')).toContainText('MAX');
      await expect(pricing.getByTestId('extras')).toContainText('180 000 ₽ / мес');
      await expect(pricing.getByTestId('extras')).toContainText('5 000 ₽ / час');
    });

    test(`${design}: цена опции стоит одной строкой и выровнена по колонке`, async ({ page }) => {
      await openDesign(page, design);

      const prices = pricingOf(page).getByTestId('option-price');

      expect(await prices.evaluateAll(lineBoxes)).toEqual(Array.from({ length: 13 }, () => 1));
      expect(await prices.evaluateAll(columnsOf)).toBe(2);
    });

    test(`${design}: на 320px тарифы идут столбиком, без горизонтального скролла`, async ({ page }) => {
      await openDesign(page, design, { viewport: MOBILE_VIEWPORT });

      const pricing = pricingOf(page);
      const rows = pricing.getByTestId(/^plan-/);
      const boxes = await rows.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().left));

      expect(new Set(boxes).size).toBe(1);
      expect(await pricing.getByTestId('basics-group').evaluateAll(rowsOf)).toBe(1);
      expect(await pricing.getByTestId('option-price').evaluateAll(columnsOf)).toBe(1);
      expect(await documentOverflow(page)).toBe(0);
      expect(await sectionOverflow(page)).toBe(0);
    });
  }

  test('en: цены в долларах', async ({ page }) => {
    await openDesign(page, 'kinetic', { locale: 'en' });

    const pricing = pricingOf(page);

    for (const plan of PLAN_ROWS) {
      const row = pricing.getByTestId(`plan-${plan.id}`);

      await expect(row).toContainText(plan.priceEn);
      await expect(row.getByRole('link')).toHaveAttribute('href', `/en/${plan.slug}?plan=${plan.id}`);
    }
  });
});
