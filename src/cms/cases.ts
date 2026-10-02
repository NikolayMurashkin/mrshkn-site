import config from '@payload-config';
import { getPayload } from 'payload';
import type { Case, Media } from '../payload-types';
import type { SiteLocale } from '../i18n/types';
import { MEDIA_SIZES } from './consts';
import type { CaseCard, CaseDetail, CaseImage } from './types';

/** Связь с медиатекой приходит объектом только при `depth ≥ 1`, иначе это один `id`. */
const isMedia = (value: unknown): value is Media => typeof value === 'object' && value !== null;

/**
 * Адреса нарезанных webp-размеров с их шириной — для `srcset`. Размер, которого Payload не нарезал
 * (оригинал уже), приходит без ширины и отбрасывается; картинка меньше всех размеров отдается как есть.
 */
const toSrcSet = (media: Media): string | null => {
  const variants = MEDIA_SIZES.flatMap(({ name }) => {
    const size = media.sizes?.[name];

    return size?.url && size.width ? [{ url: size.url, width: size.width }] : [];
  });

  if (variants.length === 0) {
    return media.url && media.width ? `${media.url} ${media.width}w` : null;
  }

  return variants.map(({ url, width }) => `${url} ${width}w`).join(', ');
};

const toImage = (value: unknown): CaseImage | null => {
  if (!isMedia(value) || !value.url) {
    return null;
  }

  const preferred = value.sizes?.card?.url ?? value.sizes?.wide?.url ?? value.sizes?.thumbnail?.url;

  return {
    url: preferred ?? value.url,
    alt: value.alt,
    width: value.width ?? null,
    height: value.height ?? null,
    srcSet: toSrcSet(value),
  };
};

const toCard = ({ title, slug, kind, niche, design, demoUrl, metrics, cover }: Case): CaseCard | null => {
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
