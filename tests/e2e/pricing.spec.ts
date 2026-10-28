import { expect, test, type Page } from '@playwright/test';
import { DESIGNS, MOBILE_VIEWPORT } from './consts';
import { openDesign } from './open-design';

/**
 * Цена печатается целиком: у тарифов «от» — часть обещания, без нее строка прайса меняет смысл.
 * Срок в днях — у тарифов с точной ценой; отраслевое приложение ведет на готовые решения страницы Telegram-приложений.
 */
const PLAN_ROWS = [
  {
    id: 'industry',
    path: '/industry?plan=industry',
    name: 'Сайт для вашей сферы',
    priceRu: '70 000 ₽',
    priceEn: '$1,200',
    term: '7 дней',
  },
  {
    id: 'landing',
    path: '/landing?plan=landing',
    name: 'Лендинг «Старт»',
    priceRu: '50 000 ₽',
    priceEn: '$2,400',
    term: '4 дня',
  },
  {
    id: 'industryMiniApp',
    path: '/mini-app#ready',
    name: 'Отраслевое приложение в Telegram',
    priceRu: '90 000 ₽',
    priceEn: '$1,800',
    term: '7 дней',
  },
  {
    id: 'business',
    path: '/business?plan=business',
    name: 'Сайт «Бизнес»',
    priceRu: '180 000 ₽',
    priceEn: '$4,500',
    term: '14 дней',
  },
  {
    id: 'miniApp',
    path: '/mini-app?plan=miniApp',
    name: 'Telegram-приложение',
    priceRu: 'от 180 000 ₽',
    priceEn: 'from $3,500',
    term: null,
  },
  {
    id: 'store',
    path: '/store?plan=store',
    name: 'Интернет-магазин',
    priceRu: 'от 250 000 ₽',
    priceEn: 'from $8,000',
    term: null,
  },
  {
    id: 'mvp',
    path: '/mvp?plan=mvp',
    name: 'MVP «Продукт»',
    priceRu: 'от 300 000 ₽',
    priceEn: 'from $12,000',
    term: null,
  },
  {
    id: 'support',
    path: '/support?plan=support',
    name: 'Поддержка',
    priceRu: 'от 7 000 ₽',
    priceEn: 'from $140',
    term: null,
  },
] as const;

/** Строка у прайса о цене кейса для первых проектов. */
const CASE_OFFER_RU =
  'Мы новая студия, и нам нужны примеры работ. Поэтому первые пять проектов делаем по «цене кейса» (кейс — пример нашей работы): разработка на 30 % дешевле. Скидка — от обычной цены разработки. Опции, MAX и поддержка — по обычной цене. Скидку даем сразу: в договоре стоит цена со скидкой, все три части оплаты считаем от нее. Сколько мест осталось, скажем в ответ на заявку. Взамен просим две вещи. Первое: вы разрешаете показывать ваш сайт или приложение как пример нашей работы, без данных ваших клиентов. Второе: вы пишете отзыв о том, как шла работа, — любой, в том числе критический. Критические отзывы публикуем так же, как хорошие.';

/** Заголовок базы тарифа: что входит в цену любого сайта. */
const BASICS_HEADING_RU = 'Входит в цену любого сайта';

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

/**
 * Сколько строк занимает текст элемента. Считается по `Range`, а не по `getClientRects()` самого узла:
 * цена — прямой ребенок grid-контейнера, то есть блокифицирована и отдает один прямоугольник на любом
 * числе строк. Range же режет содержимое по строчным боксам и ловит перенос.
 */
const lineBoxes = (nodes: Element[]) =>
  nodes.map((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);

    return range.getClientRects().length;
  });

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
        await expect(row.getByRole('link')).toHaveAttribute('href', `/ru${plan.path}`);

        if (plan.term) {
          await expect(row).toContainText(plan.term);
        }
      }

      await expect(pricing).toContainText(CASE_OFFER_RU);
      await expect(pricing.getByText('первые пять проектов', { exact: false })).toBeVisible();
    });

    test(`${design}: база тарифа, опции и Telegram с MAX за одну цену`, async ({ page }) => {
      await openDesign(page, design);

      const pricing = pricingOf(page);

      await expect(pricing.getByRole('heading', { level: 3, name: BASICS_HEADING_RU })).toBeVisible();
      await expect(pricing.getByTestId('basics').getByRole('listitem')).toHaveCount(13);
      await expect(pricing.getByTestId('basics-group')).toHaveCount(4);
      await expect(pricing.getByTestId('options').getByRole('listitem')).toHaveCount(13);
      await expect(pricing.getByTestId('options')).toContainText('40 000 ₽');
      await expect(pricing.getByTestId('mini-app-note')).toContainText('MAX');
      await expect(pricing.getByTestId('extras')).toContainText('180 000 ₽ / мес');
      await expect(pricing.getByTestId('extras')).toContainText('3 000 ₽ / час');
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
      await expect(pricing.getByTestId('basics-group').first()).toBeVisible();
      await expect(pricing.getByTestId('option-price').first()).toBeVisible();
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
      await expect(row.getByRole('link')).toHaveAttribute('href', `/en${plan.path}`);
    }
  });

  test('en: цена опции тоже стоит одной строкой', async ({ page }) => {
    await openDesign(page, 'kinetic', { locale: 'en' });

    const prices = pricingOf(page).getByTestId('option-price');

    expect(await prices.evaluateAll(lineBoxes)).toEqual(Array.from({ length: 13 }, () => 1));
  });
});
