import { LEGAL_LOCALE } from '@/lib/legal/consts';
import { legalOgTexts } from '@/lib/legal/page';
import { OG_CONTENT_TYPE, OG_SIZE } from '@/lib/seo/consts';
import { missingOgImage, renderOgImage } from '@/lib/seo/og';
import type { OgImageProps } from '@/lib/seo/types';

export const size = OG_SIZE;

export const contentType = OG_CONTENT_TYPE;

const Image = async ({ params }: OgImageProps<{ locale: string }>) => {
  const { locale } = await params;

  if (locale !== LEGAL_LOCALE) {
    return missingOgImage();
  }

  return renderOgImage(await legalOgTexts('howWeWork'));
};

export default Image;
