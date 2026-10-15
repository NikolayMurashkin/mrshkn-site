import type { Metadata } from 'next';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ConsentProvider } from '@/components/Analytics/ConsentProvider';
import type { ConsentProviderProps } from '@/components/Analytics/types';
import sitemap from '@/app/sitemap';
import { LOCALES } from '@/i18n/consts';
import { SITE_PAGES } from '@/lib/seo/consts';

/**
 * Страница отзыва открывается только по личной ссылке: код в адресе — это и есть пропуск. Поэтому она закрыта
 * от индекса, ее нет в карте сайта, а адрес с кодом не уходит дальше в заголовке Referer.
 */

const navigation = vi.hoisted(() => ({ pathname: '/ru' }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => navigation.pathname,
}));

vi.mock('next/script', () => ({
  default: ({ id, src, children }: { id?: string; src?: string; children?: ReactNode }) =>
    createElement('script', {
      id,
      src,
      dangerouslySetInnerHTML: typeof children === 'string' ? { __html: children } : undefined,
    }),
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

vi.mock('@/cms/reviews', () => ({
  getReviewState: async () => ({ view: 'form', project: 'Project' }),
}));

vi.mock('@/cms/cases', () => ({
  getCases: async () => [],
  getCaseBySlug: async () => null,
  hasCases: async () => true,
}));

type GenerateMetadata = (props: { params: Promise<never> }) => Promise<Metadata>;

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

const REVIEW_SOURCE = '/:locale/review/:code';

const loadHeaders = async (): Promise<HeaderRule[]> => {
  const { default: config } = await import('../../next.config');

  return ((await config.headers?.()) ?? []) as HeaderRule[];
};

describe('страница отзыва по приглашению', () => {
  it.each(LOCALES)('G1 %s: generateMetadata закрывает /review/<код> от индекса — noindex, nofollow', async (locale) => {
    const { generateMetadata } = (await import('@/app/[locale]/review/[code]/page')) as unknown as {
      generateMetadata: GenerateMetadata;
    };

    const metadata = await generateMetadata({ params: Promise.resolve({ locale, code: 'any' }) as Promise<never> });

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('G2: headers() отдает Referrer-Policy: no-referrer для /:locale/review/:code, правило админки на месте', async () => {
    const rules = await loadHeaders();
    const review = rules.filter(({ source }) => source === REVIEW_SOURCE);

    expect(
      review.flatMap(({ headers }) =>
        headers.filter(({ key }) => key.toLowerCase() === 'referrer-policy').map(({ value }) => value),
      ),
    ).toEqual(['no-referrer']);
    expect(
      rules.some(
        ({ source, headers }) => source === '/admin/:path*' && headers.some(({ key }) => key === 'Critical-CH'),
      ),
      'правило /admin/:path* с Critical-CH',
    ).toBe(true);
  });

  /** Страховка: страницы отзыва в карте сайта нет и сейчас, тест держит это после реализации. */
  it('G3: в sitemap() и SITE_PAGES нет /review', async () => {
    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => url.includes('/review'))).toEqual([]);
    expect(SITE_PAGES.filter((path) => path.includes('/review'))).toEqual([]);
  });

  /** Счетчики шлют адрес страницы целиком: на странице отзыва в нем код ссылки, поэтому их там нет совсем. */
  it.each([
    ['/ru', true],
    ['/en/brief', true],
    ['/ru/review/invite-code', false],
    ['/en/review/invite-code', false],
  ] as const)('G4: счетчики после согласия на %s — %s', (pathname, expected) => {
    navigation.pathname = pathname;

    const markup = renderToStaticMarkup(
      createElement(
        ConsentProvider,
        { initialChoice: 'granted', metrikaId: '12345678', gaId: 'G-TEST123' } as ConsentProviderProps,
        null,
      ),
    );

    expect({ metrika: markup.includes('metrika-init'), ga: markup.includes('gtag-init') }).toEqual({
      metrika: expected,
      ga: expected,
    });
  });
});
