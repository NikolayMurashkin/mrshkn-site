import { expect, test, type Page, type Request } from '@playwright/test';
import { DESIGN_COOKIE, DESIGNS, PREVIEW_BASE_URL, SHORT_VIEWPORT, THEME_STORAGE_KEY } from './consts';
import type { DesignName } from './types';

const DEFAULT_DESIGN: DesignName = 'kinetic';

const OTHER_DESIGNS = DESIGNS.filter((design) => design !== DEFAULT_DESIGN);

/** Шапки направлений разной высоты: браузер сдвигает скролл на эту разницу (scroll anchoring), это не прыжок. */
const SCROLL_ANCHOR_TOLERANCE = 40;

/** Семейства шрифтов направления — по ним из общего CSS достаются адреса файлов шрифтов. */
const DESIGN_FONTS: Record<DesignName, string[]> = {
  kinetic: ['Unbounded', 'Golos Text'],
  terminal: ['JetBrains Mono', 'IBM Plex Sans'],
  pop: ['Rubik'],
  swiss: ['Geologica'],
  editorial: ['Prata', 'Onest'],
};

const ssrHtml = async (page: Page) => (await page.request.get('/ru')).text();

const htmlDesignOf = (html: string) => html.match(/<html[^>]*\bdata-design="([a-z]+)"/)?.[1];

const isStaticAsset = (url: string) => url.includes('/_next/static/');

const trackRequests = (page: Page) => {
  const urls: string[] = [];
  page.on('request', (request: Request) => {
    if (isStaticAsset(request.url())) {
      urls.push(request.url());
    }
  });
  return urls;
};

const staticBodies = async (page: Page, urls: string[]) => {
  const bodies: Record<string, string> = {};
  for (const url of new Set(urls.filter((item) => /\.(css|js)(\?|$)/.test(item)))) {
    bodies[url] = await (await page.request.get(url)).text();
  }
  return bodies;
};

const moduleIdsOf = (className: string) => className.split(/\s+/).map((name) => name.replace(/__[a-z0-9-]+$/i, ''));

/** Идентификаторы CSS-модулей шапки, hero и подвала направления — то, что попадает только в его чанк. */
const sectionModuleIds = async (page: Page, design: DesignName) => {
  await page.context().addCookies([{ name: DESIGN_COOKIE, value: design, url: PREVIEW_BASE_URL }]);
  await page.goto('/ru');
  await expect(page.locator('html')).toHaveAttribute('data-design', design);
  await page.evaluate(() => document.fonts.ready);
  const classNames = await page
    .locator('header, main section, footer')
    .evaluateAll((nodes) => nodes.map((node) => node.className));
  await page.context().clearCookies();
  return classNames.flatMap(moduleIdsOf).filter((id) => id.includes('-module'));
};

/** Адреса файлов шрифтов по семействам, вытащенные из @font-face загруженных стилей. */
const fontFilesByFamily = (cssBodies: string[]) => {
  const files: Record<string, string[]> = {};
  for (const css of cssBodies) {
    for (const rule of css.match(/@font-face\{[^}]*\}/g) ?? []) {
      const family = rule
        .match(/font-family:([^;]+);/)?.[1]
        .replace(/["']/g, '')
        .trim();
      const file = rule.match(/url\(([^)]+)\)/)?.[1].replace(/["']/g, '');
      if (family && file) {
        (files[family] ??= []).push(file.replace(/^\.\.\//, ''));
      }
    }
  }
  return files;
};

const openSwitcher = async (page: Page) => {
  await page.getByTestId('design-switcher').click();
  return page.getByTestId('design-menu');
};

test.describe('переключатель направления', () => {
  test('без cookie SSR отдает kinetic; выбор Terminal пишет cookie, после перезагрузки SSR отдает terminal', async ({
    page,
  }) => {
    expect(htmlDesignOf(await ssrHtml(page))).toBe(DEFAULT_DESIGN);

    await page.goto('/ru');
    const menu = await openSwitcher(page);
    await menu.getByRole('button', { name: 'Terminal' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-design', 'terminal');
    const cookie = (await page.context().cookies()).find((item) => item.name === DESIGN_COOKIE);
    expect(cookie?.value).toBe('terminal');

    await page.reload();

    const html = await ssrHtml(page);
    expect(htmlDesignOf(html)).toBe('terminal');
    expect(html).toContain('mrshkn build --site --days 14 --fixed-price');
    await expect(page.getByTestId('design-switcher')).toContainText('Terminal');
  });

  test('клиентское переключение: скролл на месте, идет через View Transitions, без ошибок в консоли', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    await page.addInitScript(() => {
      const original = document.startViewTransition.bind(document);
      (window as unknown as { viewTransitions: number }).viewTransitions = 0;
      document.startViewTransition = (callback) => {
        (window as unknown as { viewTransitions: number }).viewTransitions += 1;
        return original(callback);
      };
    });
    await page.setViewportSize(SHORT_VIEWPORT);
    await page.goto('/ru');
    await page.evaluate(() => window.scrollTo(0, 300));
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(300);

    const menu = await openSwitcher(page);
    await menu.getByRole('button', { name: 'Pop' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-design', 'pop');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate((key) => window.localStorage.getItem(key), THEME_STORAGE_KEY)).toBeNull();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('14 дней');
    const scrollY = await page.evaluate(() => Math.round(window.scrollY));
    expect(scrollY).toBeGreaterThanOrEqual(300 - SCROLL_ANCHOR_TOLERANCE);
    expect(scrollY).toBeLessThanOrEqual(300 + SCROLL_ANCHOR_TOLERANCE);
    expect(await page.evaluate(() => (window as unknown as { viewTransitions: number }).viewTransitions)).toBe(1);
    expect(errors).toEqual([]);
  });

  test('выбранная вручную тема переживает смену направления и перезагрузку', async ({ page }) => {
    await page.context().addCookies([{ name: DESIGN_COOKIE, value: 'pop', url: PREVIEW_BASE_URL }]);
    await page.goto('/ru');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const menu = await openSwitcher(page);
    await menu.getByRole('button', { name: 'Swiss' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-design', 'swiss');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate((key) => window.localStorage.getItem(key), THEME_STORAGE_KEY)).toBe('dark');

    const html = await ssrHtml(page);
    expect(htmlDesignOf(html)).toBe('swiss');
    expect(html).toMatch(/<html[^>]*data-theme="dark"/);
  });

  test('при загрузке /ru не грузятся чанки и шрифты других направлений', async ({ browser, page: scout }) => {
    const foreignModuleIds: string[] = [];
    for (const design of OTHER_DESIGNS) {
      foreignModuleIds.push(...(await sectionModuleIds(scout, design)));
    }
    expect(foreignModuleIds.length).toBeGreaterThanOrEqual(OTHER_DESIGNS.length * 3);

    const context = await browser.newContext({ baseURL: PREVIEW_BASE_URL });
    const page = await context.newPage();
    const requests = trackRequests(page);
    await page.goto('/ru');
    await expect(page.locator('html')).toHaveAttribute('data-design', DEFAULT_DESIGN);
    await page.evaluate(() => document.fonts.ready);

    const bodies = await staticBodies(page, requests);
    const offenders = Object.entries(bodies).flatMap(([url, body]) =>
      foreignModuleIds.filter((id) => body.includes(id)).map((id) => `${url}: ${id}`),
    );
    expect(offenders).toEqual([]);

    const fonts = fontFilesByFamily(
      Object.entries(bodies).flatMap(([url, body]) => (url.endsWith('.css') ? [body] : [])),
    );
    const foreignFamilies = OTHER_DESIGNS.flatMap((design) => DESIGN_FONTS[design]);
    expect(Object.keys(fonts).filter((family) => foreignFamilies.includes(family))).toEqual([]);
    const ownFontFiles = DESIGN_FONTS[DEFAULT_DESIGN].flatMap((family) => fonts[family] ?? []);
    expect(ownFontFiles.length).toBeGreaterThan(0);
    const requestedFonts = requests.filter((url) => url.includes('.woff2'));
    expect(requestedFonts.length).toBeGreaterThan(0);
    expect(requestedFonts.filter((url) => !ownFontFiles.some((file) => url.includes(file)))).toEqual([]);
    await context.close();
  });

  for (const design of OTHER_DESIGNS) {
    test(`${design}: по cookie грузится свой чанк, чанки остальных направлений — нет`, async ({ page }) => {
      const ownModuleIds = await sectionModuleIds(page, design);
      const foreignModuleIds: string[] = [];
      for (const other of DESIGNS.filter((item) => item !== design)) {
        foreignModuleIds.push(...(await sectionModuleIds(page, other)));
      }

      const requests = trackRequests(page);
      await page.context().addCookies([{ name: DESIGN_COOKIE, value: design, url: PREVIEW_BASE_URL }]);
      await page.goto('/ru');
      await expect(page.locator('html')).toHaveAttribute('data-design', design);

      const bodies = Object.values(await staticBodies(page, requests));
      expect(ownModuleIds.every((id) => bodies.some((body) => body.includes(id)))).toBe(true);
      expect(foreignModuleIds.filter((id) => bodies.some((body) => body.includes(id)))).toEqual([]);
    });
  }

  test('чанк направления грузится при выборе', async ({ page }) => {
    const swissModuleIds = await sectionModuleIds(page, 'swiss');

    const requests = trackRequests(page);
    await page.goto('/ru');
    const before = await staticBodies(page, requests);
    expect(Object.values(before).some((body) => swissModuleIds.some((id) => body.includes(id)))).toBe(false);

    const menu = await openSwitcher(page);
    await menu.getByRole('button', { name: 'Swiss' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-design', 'swiss');
    await expect(page.getByRole('banner')).toBeVisible();

    const after = await staticBodies(page, requests);
    expect(Object.values(after).some((body) => swissModuleIds.some((id) => body.includes(id)))).toBe(true);
  });
});
