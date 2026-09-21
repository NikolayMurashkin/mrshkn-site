import { expect, test, type Locator, type Page } from '@playwright/test';
import { DESIGNS, LOCALES } from './consts';
import { openDesign } from './open-design';

/** Шапка и подвал живут на каждой странице, поэтому проверяются и на квизе, и на «спасибо». */
const INNER_PAGES = ['/brief', '/brief/thanks'] as const;

const zonesOf = (page: Page, path: string): Locator[] =>
  path === ''
    ? [page.getByRole('banner'), page.getByRole('main').locator('section').first(), page.getByRole('contentinfo')]
    : [page.getByRole('banner'), page.getByRole('contentinfo')];

/**
 * Берутся все `<a>`, а не `getByRole('link')`: у ссылки без атрибута `href` нет роли link, и такая
 * дыра прошла бы мимо проверки.
 */
const hrefsOf = async (page: Page, path: string) => {
  const perZone = await Promise.all(
    zonesOf(page, path).map((zone) =>
      zone.locator('a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? '')),
    ),
  );

  return perZone.flat();
};

/**
 * Ссылка проверяется до конца: адрес отдает 200, а якорь ищется в DOM той страницы, куда ссылка
 * ведет, а не той, где ее нажали. Шапка рендерится везде, и без этого якоря секций главной
 * оказывались мертвыми на внутренних страницах. Якорь ищется локатором, а не подстрокой в HTML:
 * `data-testid="process"` содержит `id="process"`, и подстрочная проверка пропускала бы мертвый якорь.
 */
const checkLinks = async (page: Page, locale: string, path: string) => {
  const here = `/${locale}${path}`;
  const hrefs = await hrefsOf(page, path);
  const anchors = new Map<string, Set<string>>();

  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs.filter((href) => href === '#' || href === '')).toEqual([]);

  for (const href of hrefs) {
    const [target, anchor] = href.split('#');
    const address = target || here;

    expect(address.startsWith('/'), `внешний адрес ${href} в шапке, hero или подвале`).toBe(true);

    const response = await page.request.get(address);

    expect(response.status(), `адрес ${href}`).toBe(200);

    if (anchor) {
      anchors.set(address, (anchors.get(address) ?? new Set()).add(anchor));
    }
  }

  for (const [address, targets] of anchors) {
    if (address !== page.url().replace(/^https?:\/\/[^/]+/, '')) {
      await page.goto(address);
    }

    for (const anchor of targets) {
      await expect(page.locator(`#${anchor}`), `якорь #${anchor} на странице ${address}`).toHaveCount(1);
    }
  }
};

test.describe('живые ссылки шапки, hero и подвала', () => {
  for (const design of DESIGNS) {
    for (const locale of LOCALES) {
      test(`${design} / ${locale}: ни одной ссылки в решетку`, async ({ page }) => {
        await openDesign(page, design, { locale });

        const hrefs = await hrefsOf(page, '');

        expect(hrefs.length).toBeGreaterThan(0);
        expect(hrefs.filter((href) => href === '#' || href === '')).toEqual([]);
      });

      test(`${design} / ${locale}: CTA ведут в квиз, остальное — на живые адреса и якоря`, async ({ page }) => {
        await openDesign(page, design, { locale });

        expect(await hrefsOf(page, '')).toContain(`/${locale}/brief`);
        await checkLinks(page, locale, '');
      });

      for (const path of INNER_PAGES) {
        test(`${design} / ${locale}: на странице ${path} шапка и подвал ведут на живые адреса и якоря`, async ({
          page,
        }) => {
          await openDesign(page, design, { locale, path });
          await checkLinks(page, locale, path);
        });
      }
    }
  }
});
