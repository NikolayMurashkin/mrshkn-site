import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { DESIGN_COOKIE, DESIGNS, PREVIEW_BASE_URL, THEMES } from './consts';
import { openDesign } from './open-design';
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

const SCREENSHOT = { stylePath: join(__dirname, 'screenshot.css') };

const fontOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((node) => window.getComputedStyle(node).fontFamily);

const tokenColor = (page: Page, token: string) =>
  page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = window.getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);

const paintOf = (locator: Locator) =>
  locator.evaluate((node) => {
    const style = window.getComputedStyle(node);
    return { color: style.color, opacity: style.opacity };
  });

test.describe('каркас направлений', () => {
  for (const design of DESIGNS) {
    test(`${design}: cookie выбирает направление, шапка и подвал на месте`, async ({ page }) => {
      const shape = SHAPES[design];

      await openDesign(page, design, { theme: 'dark' });

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

      await openDesign(page, design, { theme: 'dark' });

      expect(await fontOf(page, 'body')).toMatch(shape.textFont);
      expect(await fontOf(page, '[data-testid="brand"]')).toMatch(shape.displayFont);
      expect(await fontOf(page, 'h1')).toMatch(shape.heroTitleFont);
    });

    test(`${design}: hero по артборду — заголовок, две кнопки, свой элемент`, async ({ page }) => {
      const shape = SHAPES[design];

      await openDesign(page, design, { theme: 'dark' });

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

test.describe('контраст в светлой теме — цвет токеном, без opacity', () => {
  test('pop: подпись подвала', async ({ page }) => {
    await openDesign(page, 'pop', { theme: 'light' });

    const note = page.getByRole('contentinfo').getByText('Отвечаем в течение часа');

    expect(await paintOf(note)).toEqual({ color: await tokenColor(page, '--accent-contrast-soft'), opacity: '1' });
  });

  test('editorial: неактивная локаль в шапке', async ({ page }) => {
    await openDesign(page, 'editorial', { theme: 'light' });

    const header = page.getByRole('banner');

    expect(await paintOf(header.getByTestId('locale-en'))).toEqual({
      color: await tokenColor(page, '--muted'),
      opacity: '1',
    });
    expect(await paintOf(header.getByTestId('locale-ru'))).toEqual({
      color: await tokenColor(page, '--muted'),
      opacity: '1',
    });
    await expect(header.getByTestId('locale-ru')).toHaveCSS('text-decoration-line', 'underline');
    await expect(header.getByTestId('locale-en')).toHaveCSS('text-decoration-line', 'none');
  });
});

test.describe('эталоны шапки и подвала', () => {
  test.skip(process.platform !== 'darwin', 'эталоны сняты на macOS, на других платформах не сравниваются');

  for (const design of DESIGNS) {
    for (const theme of THEMES) {
      test(`${design} / ${theme}`, async ({ page }) => {
        await openDesign(page, design, { theme });

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
