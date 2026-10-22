import config from '@payload-config';
import type { Metadata } from 'next';
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload';
import { isValidElement, type ReactNode } from 'react';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import sitemap from '@/app/sitemap';
import { getCases } from '@/cms/cases';
import { DesignSection } from '@/designs/registry';
import { LOCALES } from '@/i18n/consts';
import { SITE_URL } from '@/lib/consts';

/**
 * Страница `/work` — все опубликованные кейсы сеткой карточек направления. Она условная: без опубликованных кейсов
 * ее нет (404) и нет в карте сайта. Кейсы и карта сайта — настоящие, из Payload; направление и переводы — заглушки.
 */

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

/** Клиентские чанки направлений здесь не грузятся: важно, какую секцию и с какими данными страница просит. */
vi.mock('@/designs/registry', () => ({
  DesignSection: vi.fn(() => null),
  preloadDesign: vi.fn(),
}));

type WorkPageModule = {
  default: (props: { params: Promise<{ locale: string }> }) => Promise<ReactNode>;
  generateMetadata: (props: { params: Promise<{ locale: string }> }) => Promise<Metadata>;
};

let payload: Payload;

const loadPage = async () => (await import('@/app/[locale]/work/page')) as unknown as WorkPageModule;

const params = (locale: string) => Promise.resolve({ locale });

/** Пропсы всех `DesignSection` в дереве, которое вернула страница. */
const designSections = (node: ReactNode): Record<string, unknown>[] => {
  if (Array.isArray(node)) {
    return node.flatMap(designSections);
  }

  if (!isValidElement<Record<string, unknown>>(node)) {
    return [];
  }

  const own = node.type === DesignSection ? [node.props] : [];

  return [...own, ...designSections(node.props.children as ReactNode)];
};

const createImage = async (name: string) => {
  const data = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#2f5bea' } })
    .png()
    .toBuffer();

  return payload.create({
    collection: 'media',
    locale: 'ru',
    data: { alt: `Картинка ${name}` },
    file: { data, mimetype: 'image/png', name: `${name}.png`, size: data.length },
  });
};

/** Опубликованный кейс — со скрином Lighthouse и ссылкой на демо: без них публикация не проходит. */
const createCase = async (slug: string, status: 'published' | 'draft') => {
  const cover = await createImage(`cover-${slug}`);
  const lighthouse = await createImage(`lighthouse-${slug}`);

  return payload.create({
    collection: 'cases',
    locale: 'ru',
    data: {
      title: `Кейс ${slug}`,
      slug,
      kind: 'demo',
      niche: 'clinic',
      design: 'swiss',
      cover: cover.id,
      lighthouse: lighthouse.id,
      demoUrl: `https://${slug}.example.com`,
      _status: status,
    } as RequiredDataFromCollectionSlug<'cases'>,
  });
};

const urlsOf = async () => (await sitemap()).map(({ url }) => url);

const NOT_FOUND = { digest: expect.stringContaining('404') };

beforeAll(async () => {
  payload = await getPayload({ config });
});

afterAll(async () => {
  await payload.destroy();
});

beforeEach(async () => {
  await payload.delete({ collection: 'cases', where: { id: { exists: true } }, overrideAccess: true });
  vi.mocked(DesignSection).mockClear();
});

describe('карта сайта и страница /work', () => {
  it('при одном опубликованном кейсе в карте сайта /ru/work и /en/work, по одному разу', async () => {
    await createCase('work-sitemap-published', 'published');

    const urls = await urlsOf();

    LOCALES.forEach((locale) =>
      expect(urls.filter((url) => url === `${SITE_URL}/${locale}/work`)).toEqual([`${SITE_URL}/${locale}/work`]),
    );
  });

  it('при одном черновике в карте сайта нет ни одного адреса /work', async () => {
    await createCase('work-sitemap-draft', 'draft');

    const urls = await urlsOf();

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => url.includes('/work'))).toEqual([]);
  });

  it('без опубликованных кейсов страница /work вызывает notFound()', async () => {
    await createCase('work-page-draft', 'draft');

    const { default: WorkPage } = await loadPage();

    await expect(WorkPage({ params: params('ru') })).rejects.toMatchObject(NOT_FOUND);
  });

  it.each([...LOCALES])(
    '%s: страница /work просит секцию works в варианте page со всеми кейсами getCases',
    async (locale) => {
      await createCase('work-page-first', 'published');
      await createCase('work-page-draft-hidden', 'draft');
      await createCase('work-page-second', 'published');

      const { default: WorkPage } = await loadPage();
      const expected = await getCases(locale);

      expect(expected.map(({ slug }) => slug)).toEqual(['work-page-second', 'work-page-first']);

      const sections = designSections(await WorkPage({ params: params(locale) }));

      expect(sections).toHaveLength(1);
      expect(sections[0]).toMatchObject({ section: 'works', variant: 'page' });
      expect(sections[0].cases).toEqual(expected);
    },
  );

  it('метаданные /work: canonical на /ru/work, языковые версии ru, en и x-default', async () => {
    await createCase('work-meta-published', 'published');

    const { generateMetadata } = await loadPage();
    const { alternates } = await generateMetadata({ params: params('ru') });

    expect(String(alternates?.canonical)).toMatch(/\/ru\/work$/);
    expect(alternates?.languages).toEqual({ ru: '/ru/work', en: '/en/work', 'x-default': '/ru/work' });
  });

  it('на чужом языке страница /work вызывает notFound()', async () => {
    await createCase('work-page-locale', 'published');

    const { default: WorkPage } = await loadPage();

    await expect(WorkPage({ params: params('de') })).rejects.toMatchObject(NOT_FOUND);
  });
});
