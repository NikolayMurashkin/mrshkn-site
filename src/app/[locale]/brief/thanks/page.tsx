import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { THANKS_HREF } from '@/lib/brief/consts';
import { pageMetadata } from '@/lib/seo/metadata';

type ThanksPageProps = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: ThanksPageProps): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'briefThanks.meta' });

  return {
    ...pageMetadata({ locale, path: THANKS_HREF, title: t('title'), description: t('description') }),
    robots: { index: false, follow: true },
  };
};

const ThanksPage = async ({ params }: ThanksPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const design = await getDesign();

  return (
    <DesignSection
      design={design}
      section="briefThanks"
    />
  );
};

export default ThanksPage;
