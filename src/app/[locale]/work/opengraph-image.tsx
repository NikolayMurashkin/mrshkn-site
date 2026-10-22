import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { OG_CONTENT_TYPE, OG_SIZE } from '@/lib/seo/consts';
import { missingOgImage, renderOgImage } from '@/lib/seo/og';
import type { OgImageProps } from '@/lib/seo/types';

export const size = OG_SIZE;

export const contentType = OG_CONTENT_TYPE;

const Image = async ({ params }: OgImageProps<{ locale: string }>) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return missingOgImage();
  }

  const t = await getTranslations({ locale, namespace: 'work' });

  return renderOgImage({ title: t('pageTitle'), description: t('pageDescription') });
};

export default Image;
