import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getReviewState } from '@/cms/reviews';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';

type ReviewPageProps = {
  params: Promise<{ locale: string; code: string }>;
};

/** Страница открывается только по личной ссылке: в индекс и в карту сайта она не попадает. */
export const generateMetadata = async ({ params }: ReviewPageProps): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'review.meta' });

  return { title: t('title'), robots: { index: false, follow: false } };
};

const ReviewPage = async ({ params }: ReviewPageProps) => {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const [design, state] = await Promise.all([getDesign(), getReviewState(code)]);

  return (
    <DesignSection
      design={design}
      section="review"
      code={code}
      {...state}
    />
  );
};

export default ReviewPage;
