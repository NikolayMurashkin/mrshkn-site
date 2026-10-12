import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { PRIVACY_HREF } from '@/lib/consts';
import { pageMetadata } from '@/lib/seo/metadata';

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: PrivacyPageProps): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'privacy.meta' });

  return pageMetadata({ locale, path: PRIVACY_HREF, title: t('title'), description: t('description') });
};

const PrivacyPage = async ({ params }: PrivacyPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const design = await getDesign();

  return (
    <main>
      <DesignSection
        design={design}
        section="privacyPage"
      />
    </main>
  );
};

export default PrivacyPage;
