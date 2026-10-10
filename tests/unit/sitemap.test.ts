import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sitemap from '@/app/sitemap';
import { getCases } from '@/cms/cases';
import type { CaseCard } from '@/cms/types';
import { PRICING_PLANS } from '@/content/pricing';
import { LOCALES } from '@/i18n/consts';
import { BRIEF_HREF, THANKS_HREF } from '@/lib/brief/consts';
import { SITE_URL } from '@/lib/consts';
import { SITE_PAGES } from '@/lib/seo/consts';

vi.mock('@/cms/cases', () => ({
  getCases: vi.fn(),
  getCaseBySlug: vi.fn(async () => null),
  hasCases: vi.fn(async () => true),
}));

const CASE_SLUGS = ['alpha', 'beta'];

const makeCase = (slug: string): CaseCard => ({
  title: `Case ${slug}`,
  slug,
  kind: 'demo',
  niche: 'clinic',
  design: 'swiss',
  demoUrl: null,
  metrics: [],
  cover: { url: `/media/${slug}.png`, alt: slug, width: 1200, height: 800, srcSet: null },
  coverCaption: null,
});

const EXPECTED_PAGES = ['', ...PRICING_PLANS.map((plan) => `/${plan.slug}`), BRIEF_HREF];

const pageUrl = (locale: string, path: string) => `${SITE_URL}/${locale}${path}`;

const staticUrls = () => LOCALES.flatMap((locale) => EXPECTED_PAGES.map((path) => pageUrl(locale, path)));

const caseUrls = () => LOCALES.flatMap((locale) => CASE_SLUGS.map((slug) => pageUrl(locale, `/work/${slug}`)));

const urlsOf = (entries: Awaited<ReturnType<typeof sitemap>>) => entries.map((entry) => entry.url);

/** Путь страницы без локали для адреса из карты сайта: по нему проверяются ее языковые версии. */
const pathOf = (url: string) => {
  const locale = LOCALES.find((item) => url === pageUrl(item, '') || url.startsWith(pageUrl(item, '/')));

  return locale ? url.slice(pageUrl(locale, '').length) : null;
};

beforeEach(() => {
  vi.mocked(getCases).mockResolvedValue(CASE_SLUGS.map(makeCase));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('список страниц сайта', () => {
  it('S0: главная, страница каждой услуги и квиз, без «спасибо» и без дублей', () => {
    expect(new Set(SITE_PAGES)).toEqual(new Set(EXPECTED_PAGES));
    expect(SITE_PAGES).toHaveLength(EXPECTED_PAGES.length);
  });
});

describe('sitemap()', () => {
  it('S1: все страницы в обоих языках и кейсы каждой локали, абсолютными адресами, без дублей', async () => {
    const urls = urlsOf(await sitemap());

    expect(new Set(urls)).toEqual(new Set([...staticUrls(), ...caseUrls()]));
    expect(urls).toHaveLength(staticUrls().length + caseUrls().length);

    for (const url of urls) {
      expect(url.startsWith(SITE_URL), `${url}: абсолютный адрес`).toBe(true);
    }
  });

  it('S2: нет «спасибо» квиза, админки и API', async () => {
    const urls = urlsOf(await sitemap());

    expect(urls.length).toBeGreaterThan(0);

    for (const url of urls) {
      expect(url).not.toContain(THANKS_HREF);
      expect(url).not.toContain('/admin');
      expect(url).not.toContain('/api');
    }
  });

  it('S3: у каждой записи hreflang ru, en и x-default → русская версия той же страницы', async () => {
    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      const path = pathOf(entry.url);
      const languages = (entry.alternates?.languages ?? {}) as Record<string, string>;

      expect(path, `${entry.url}: адрес с локалью`).not.toBeNull();
      expect(Object.keys(languages).sort(), entry.url).toEqual(['en', 'ru', 'x-default']);
      expect(new URL(languages.ru).href, `${entry.url}: ru`).toBe(new URL(pageUrl('ru', path!)).href);
      expect(new URL(languages.en).href, `${entry.url}: en`).toBe(new URL(pageUrl('en', path!)).href);
      expect(new URL(languages['x-default']).href, `${entry.url}: x-default`).toBe(new URL(pageUrl('ru', path!)).href);
    }
  });

  it('S4: кейсов нет — все статические страницы обеих локалей и ни одного /work/', async () => {
    vi.mocked(getCases).mockResolvedValue([]);

    const urls = urlsOf(await sitemap());

    expect(new Set(urls)).toEqual(new Set(staticUrls()));
    expect(urls.some((url) => url.includes('/work/'))).toBe(false);
  });

  it('S5: CMS недоступна — статические страницы обеих локалей без /work/, ошибка в console.error', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(getCases).mockRejectedValue(new Error('database is down'));

    const urls = urlsOf(await sitemap());

    expect(new Set(urls)).toEqual(new Set(staticUrls()));
    expect(urls.some((url) => url.includes('/work/'))).toBe(false);
    expect(error).toHaveBeenCalled();
  });
});
