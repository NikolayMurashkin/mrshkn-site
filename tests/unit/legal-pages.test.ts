import type { Metadata } from 'next';
import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import sitemap from '@/app/sitemap';
import { SITE_URL } from '@/lib/consts';
import { SITE_PAGES } from '@/lib/seo/consts';

/**
 * Оферта и памятка «Как мы работаем» есть только на русском: английского пакета документов пока нет →
 * `/en/docs/offer` и `/en/docs/how-we-work` не отдают страницу, в карте сайта и hreflang английской версии нет.
 */

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));

vi.mock('@/designs/server', () => ({
  getDesign: async () => 'kinetic',
}));

vi.mock('next-intl/server', () => {
  const translator = Object.assign((key: string) => key, {
    raw: (key: string) => key,
    rich: (key: string) => key,
    markup: (key: string) => key,
    has: () => true,
  });

  return {
    getTranslations: async () => translator,
    getMessages: async () => ({}),
    setRequestLocale: () => {},
  };
});

vi.mock('@/cms/cases', () => ({
  getCases: async () => [],
  getCaseBySlug: async () => null,
  hasCases: async () => false,
}));

type PageProps = { params: Promise<{ locale: string }> };

type PageModule = {
  default: (props: PageProps) => Promise<unknown>;
  generateMetadata: (props: PageProps) => Promise<Metadata>;
};

const PAGES = [
  ['оферта', '/docs/offer', () => import('@/app/[locale]/docs/offer/page') as unknown as Promise<PageModule>],
  [
    'памятка',
    '/docs/how-we-work',
    () => import('@/app/[locale]/docs/how-we-work/page') as unknown as Promise<PageModule>,
  ],
] as const;

const NOT_FOUND_DIGEST = 'NEXT_HTTP_ERROR_FALLBACK;404';

const propsOf = (locale: string): PageProps => ({ params: Promise.resolve({ locale }) });

/** Отказ промиса как значение: проверяется `digest` ошибки `notFound()`. */
const rejectionOf = async (promise: Promise<unknown>) =>
  promise.then(
    () => ({ rejected: false, digest: '' }),
    (error: unknown) => ({
      rejected: true,
      digest: String((error as { digest?: unknown } | null)?.digest ?? ''),
    }),
  );

const expectNotFound = async (promise: Promise<unknown>, label: string) => {
  const outcome = await rejectionOf(promise);

  expect(outcome.rejected, `${label}: промис отклонен`).toBe(true);
  expect(outcome.digest.startsWith(NOT_FOUND_DIGEST), `${label}: digest «${outcome.digest}»`).toBe(true);
};

const absolute = (value: string | URL) => new URL(value, SITE_URL).href;

describe('маршруты оферты и памятки', () => {
  it('A1: /en/docs/offer — notFound()', async () => {
    const page = await PAGES[0][2]();

    await expectNotFound(page.default(propsOf('en')), 'оферта en');
  });

  it('A2: /en/docs/how-we-work — notFound()', async () => {
    const page = await PAGES[1][2]();

    await expectNotFound(page.default(propsOf('en')), 'памятка en');
  });

  it.each(PAGES)('A3: ru — %s отдает React-элемент', async (_label, _path, load) => {
    const page = await load();
    const element = await page.default(propsOf('ru'));

    expect(isValidElement(element)).toBe(true);
  });

  it.each(PAGES)(
    'A4: %s — generateMetadata en → notFound(), ru → canonical на ru-страницу без hreflang en',
    async (label, path, load) => {
      const page = await load();

      await expectNotFound(page.generateMetadata(propsOf('en')), `метаданные ${label} en`);

      const { alternates } = await page.generateMetadata(propsOf('ru'));
      const canonical = alternates?.canonical;
      const languages = (alternates?.languages ?? {}) as Record<string, string | URL>;

      expect(typeof canonical === 'string' || canonical instanceof URL, `canonical: ${String(canonical)}`).toBe(true);
      expect(absolute(canonical as string | URL)).toBe(`${SITE_URL}/ru${path}`);
      expect(Object.keys(languages), 'ключи hreflang').not.toContain('en');
      expect(
        Object.values(languages).filter((value) => new URL(String(value), SITE_URL).pathname.startsWith('/en/')),
        'hreflang на /en/…',
      ).toEqual([]);
    },
  );
});

describe('карта сайта и список страниц', () => {
  it('A5: в sitemap() обе ru-страницы есть, en-версий нет, у ru-записей нет hreflang en', async () => {
    const entries = await sitemap();
    const urls = entries.map(({ url }) => url);

    expect(urls).toContain(`${SITE_URL}/ru/docs/offer`);
    expect(urls).toContain(`${SITE_URL}/ru/docs/how-we-work`);
    expect(urls).not.toContain(`${SITE_URL}/en/docs/offer`);
    expect(urls).not.toContain(`${SITE_URL}/en/docs/how-we-work`);

    for (const path of ['/docs/offer', '/docs/how-we-work']) {
      const entry = entries.find(({ url }) => url === `${SITE_URL}/ru${path}`);
      const languages = (entry?.alternates?.languages ?? {}) as Record<string, string>;

      expect(Object.keys(languages), `${path}: ключи hreflang`).not.toContain('en');
    }
  });

  it('A6: SITE_PAGES без оферты и памятки — у страниц списка hreflang ru, en и x-default', () => {
    expect(SITE_PAGES).not.toContain('/docs/offer');
    expect(SITE_PAGES).not.toContain('/docs/how-we-work');
  });
});
