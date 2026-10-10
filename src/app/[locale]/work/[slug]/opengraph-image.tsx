import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getCaseBySlug } from '@/cms/cases';
import { excerpt } from '@/content/work';
import { routing } from '@/i18n/routing';
import { OG_CONTENT_TYPE, OG_SIZE } from '@/lib/seo/consts';
import { missingOgImage, renderOgImage } from '@/lib/seo/og';
import type { OgImageProps } from '@/lib/seo/types';

export const size = OG_SIZE;

export const contentType = OG_CONTENT_TYPE;

const Image = async ({ params }: OgImageProps<{ locale: string; slug: string }>) => {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return missingOgImage();
  }

  const caseItem = await getCaseBySlug(locale, slug);

  if (!caseItem) {
    return missingOgImage();
  }

  const t = await getTranslations({ locale, namespace: 'work' });

  return renderOgImage({
    kicker: t(`kind.${caseItem.kind}`),
    title: caseItem.title,
    description: excerpt(caseItem.task) || undefined,
  });
};

export default Image;
