import type { Metadata } from 'next';
import { describe, expect, it, vi } from 'vitest';
import { LOCALES } from '@/i18n/consts';
import { SERVICES } from '@/content/services';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { SITE_URL } from '@/lib/consts';
import { SITE_PAGES } from '@/lib/seo/consts';

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));

vi.mock('next-intl/server', async () => {
  const { createTranslator } = await import('next-intl');
  const ru = (await import('../../messages/ru.json')).default;
  const en = (await import('../../messages/en.json')).default;
  const messages: Record<string, unknown> = { ru, en };

  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace?: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace } as never),
    getMessages: async ({ locale }: { locale: string }) => messages[locale],
    setRequestLocale: () => {},
  };
});

vi.mock('@/cms/cases', () => {
  const cover = { url: '/media/alpha.png', alt: 'alpha', width: 1200, height: 800, srcSet: null };
  const card = (slug: string) => ({
    title: `Case ${slug}`,
    slug,
    kind: 'demo',
    niche: 'clinic',
    design: 'swiss',
    demoUrl: null,
    metrics: [],
    cover,
    coverCaption: null,
  });

  return {
    getCases: async () => [card('alpha'), card('beta')],
    getCaseBySlug: async (_locale: string, slug: string) =>
      slug === 'alpha' ? { ...card('alpha'), task: 'Task alpha', solution: 'Solution alpha', lighthouse: null } : null,
    hasCases: async () => true,
  };
});

type GenerateMetadata = (props: { params: Promise<never> }) => Promise<Metadata>;

type PageTarget = { load: () => Promise<{ generateMetadata: GenerateMetadata }>; params: Record<string, string> };

const CASE_PATH = '/work/alpha';

const PRIVACY_PATH = '/docs/privacy';

const PAGES = [...SITE_PAGES, CASE_PATH];

const ROWS = PAGES.flatMap((path) => LOCALES.map((locale) => [locale, path] as const));

const targetOf = (path: string): PageTarget | null => {
  if (path === '') {
    return { load: () => import('@/app/[locale]/layout'), params: {} };
  }

  if (path === BRIEF_HREF) {
    return { load: () => import('@/app/[locale]/brief/page'), params: {} };
  }

  if (path === PRIVACY_PATH) {
    return { load: () => import('@/app/[locale]/docs/privacy/page'), params: {} };
  }

  const service = SERVICES.find((item) => path === `/${item.slug}`);

  if (service) {
    return { load: () => import('@/app/[locale]/[service]/page'), params: { service: service.slug } };
  }

  const caseSlug = path.match(/^\/work\/([^/]+)$/)?.[1];

  if (caseSlug) {
    return { load: () => import('@/app/[locale]/work/[slug]/page'), params: { slug: caseSlug } };
  }

  return null;
};

const metadataOf = async (locale: string, path: string): Promise<Metadata> => {
  const target = targetOf(path);

  if (!target) {
    expect.fail(`нет страницы для пути «${path}»`);
  }

  const { generateMetadata } = await target.load();

  return generateMetadata({ params: Promise.resolve({ locale, ...target.params }) as Promise<never> });
};

const absolute = (value: string | URL) => new URL(value, SITE_URL).href;

describe('метаданные страниц сайта', () => {
  it('M0: среди проверяемых страниц есть политика ПД', () => {
    expect(PAGES).toContain(PRIVACY_PATH);
  });

  it.each(ROWS)('M1 %s, «%s»: ровно один canonical — адрес этой страницы на своем языке', async (locale, path) => {
    const { alternates } = await metadataOf(locale, path);
    const canonical = alternates?.canonical;

    expect(canonical === null || canonical === undefined, 'canonical задан').toBe(false);
    expect(Array.isArray(canonical), 'canonical не массив').toBe(false);
    expect(typeof canonical === 'string' || canonical instanceof URL, 'canonical — строка или URL').toBe(true);
    expect(absolute(canonical as string | URL)).toBe(absolute(`/${locale}${path}`));
  });

  it.each(ROWS)('M2 %s, «%s»: hreflang ru, en и x-default → русская версия', async (locale, path) => {
    const { alternates } = await metadataOf(locale, path);
    const languages = (alternates?.languages ?? {}) as Record<string, string | URL>;

    expect(Object.keys(languages).sort()).toEqual(['en', 'ru', 'x-default']);
    expect(absolute(languages.ru)).toBe(absolute(`/ru${path}`));
    expect(absolute(languages.en)).toBe(absolute(`/en${path}`));
    expect(absolute(languages['x-default'])).toBe(absolute(`/ru${path}`));
  });
});
