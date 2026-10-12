import config from '@payload-config';
import { getPayload } from 'payload';
import type { Case } from '../payload-types';
import type { SiteLocale } from '../i18n/types';
import { toImage } from './image';
import type { CaseCard, CaseDetail } from './types';

const toCard = ({ title, slug, kind, niche, design, demoUrl, metrics, cover, coverCaption }: Case): CaseCard | null => {
  const image = toImage(cover);

  if (!image) {
    return null;
  }

  return {
    title,
    slug,
    kind,
    niche,
    design,
    demoUrl: demoUrl ?? null,
    metrics: (metrics ?? []).map(({ value, label }) => ({ value, label })),
    cover: image,
    coverCaption: coverCaption?.trim() || null,
  };
};

const toDetail = (doc: Case): CaseDetail | null => {
  const card = toCard(doc);

  return card && { ...card, task: doc.task ?? '', solution: doc.solution ?? '', lighthouse: toImage(doc.lighthouse) };
};

/**
 * Кейсы для витрины сайта в порядке «новые первыми». Кеша нет: страницы и так рендерятся на каждый запрос
 * (layout читает cookie направления и темы), поэтому правка в админке видна со следующей загрузки.
 */
export const getCases = async (locale: SiteLocale): Promise<CaseCard[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'cases',
    locale,
    depth: 1,
    pagination: false,
    sort: '-createdAt',
    overrideAccess: false,
  });

  return docs.flatMap((doc) => toCard(doc) ?? []);
};

/**
 * Есть ли что показывать: от этого зависят и секция на главной, и пункт меню (D21). Кейс без обложки (картинку удалили
 * из медиатеки) `getCases` отбрасывает → и здесь он не считается, иначе пункт меню вел бы в пустоту.
 */
export const hasCases = async (locale: SiteLocale): Promise<boolean> => {
  const payload = await getPayload({ config });
  const { totalDocs } = await payload.count({
    collection: 'cases',
    locale,
    where: { cover: { exists: true } },
    overrideAccess: false,
  });

  return totalDocs > 0;
};

/** Опубликованный кейс по адресу; черновик и несуществующий адрес дают `null`, как для анонимного REST. */
export const getCaseBySlug = async (locale: SiteLocale, slug: string): Promise<CaseDetail | null> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'cases',
    locale,
    depth: 1,
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
    overrideAccess: false,
  });

  return docs[0] ? toDetail(docs[0]) : null;
};
