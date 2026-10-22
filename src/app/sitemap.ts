import type { MetadataRoute } from 'next';
import { getCases } from '@/cms/cases';
import { caseHref, WORK_PAGE_PATH } from '@/content/work';
import { LOCALES } from '@/i18n/consts';
import type { SiteLocale } from '@/i18n/types';
import { SITE_URL } from '@/lib/consts';
import { languageAlternates, localePath } from '@/lib/seo/alternates';
import { SITE_PAGES } from '@/lib/seo/consts';

/** Кейсы читаются на каждый запрос: новый кейс попадает в карту сразу, а сборке база не нужна. */
export const dynamic = 'force-dynamic';

const entry = (locale: SiteLocale, path: string): MetadataRoute.Sitemap[number] => ({
  url: `${SITE_URL}${localePath(locale, path)}`,
  alternates: { languages: languageAlternates(path, SITE_URL) },
});

/**
 * Страница всех кейсов и страницы кейсов — только при опубликованных кейсах: без них `/work` отдает 404.
 * Без CMS карта сайта отдает статические страницы, а не 500; ошибка остается в логе.
 */
const casePaths = async (locale: SiteLocale): Promise<string[]> => {
  try {
    const cases = await getCases(locale);

    return cases.length > 0 ? [WORK_PAGE_PATH, ...cases.map(({ slug }) => caseHref(slug))] : [];
  } catch (error) {
    console.error(`sitemap: кейсы (${locale}) не прочитаны`, error);

    return [];
  }
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages = await Promise.all(
    LOCALES.map(async (locale) => [...SITE_PAGES, ...(await casePaths(locale))].map((path) => entry(locale, path))),
  );

  return pages.flat();
};

export default sitemap;
