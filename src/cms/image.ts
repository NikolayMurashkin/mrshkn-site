import type { Media } from '../payload-types';
import { MEDIA_SIZES } from './consts';
import type { CaseImage } from './types';

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

/** Картинка медиатеки для `<img>`; связь без файла (картинку удалили) дает `null`. */
export const toImage = (value: unknown): CaseImage | null => {
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
