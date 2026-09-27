import config from '@payload-config';
import { getPayload } from 'payload';
import type { SiteLocale } from '../i18n/types';
import type { CaseCard } from './types';

/**
 * Кейсы для витрины сайта в порядке «новые первыми». Кеша нет: страницы и так рендерятся на каждый запрос
 * (layout читает cookie направления и темы), поэтому правка в админке видна со следующей загрузки.
 */
export const getCases = async (locale: SiteLocale): Promise<CaseCard[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'cases',
    locale,
    depth: 0,
    pagination: false,
    sort: '-createdAt',
    overrideAccess: false,
  });

  return docs.map(({ title, slug, kind, niche, design, demoUrl }) => ({
    title,
    slug,
    kind,
    niche,
    design,
    demoUrl: demoUrl ?? null,
  }));
};
