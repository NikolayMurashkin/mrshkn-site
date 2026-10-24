import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { SERVICE_PLANS } from '@/content/services';
import { routing } from '@/i18n/routing';
import { OG_CONTENT_TYPE, OG_SIZE } from '@/lib/seo/consts';
import { missingOgImage, renderOgImage } from '@/lib/seo/og';
import { planPriceText } from '@/lib/seo/price';
import type { OgImageProps } from '@/lib/seo/types';

export const size = OG_SIZE;

export const contentType = OG_CONTENT_TYPE;

const Image = async ({ params }: OgImageProps<{ locale: string; service: string }>) => {
  const { locale, service: slug } = await params;
  const plan = SERVICE_PLANS.find((item) => item.slug === slug);

  if (!hasLocale(routing.locales, locale) || !plan) {
    return missingOgImage();
  }

  const t = await getTranslations({ locale, namespace: 'pricing' });

  return renderOgImage({
    kicker: planPriceText((key, values) => t(`price.${key}`, values), plan, locale),
    title: t(`plans.${plan.id}.name`),
    description: t(`plans.${plan.id}.summary`),
  });
};

export default Image;
