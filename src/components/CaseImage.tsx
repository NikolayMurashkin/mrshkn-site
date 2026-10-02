import type { CaseImageProps } from './types';

/** Обычный `<img>` с `srcset` из нарезанных Payload размеров: next/image нарезал бы картинку второй раз. */
export const CaseImage = ({ image, sizes, className, priority = false }: CaseImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className={className}
    src={image.url}
    srcSet={image.srcSet ?? undefined}
    sizes={image.srcSet ? sizes : undefined}
    width={image.width ?? undefined}
    height={image.height ?? undefined}
    alt={image.alt}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
    fetchPriority={priority ? 'high' : undefined}
  />
);
