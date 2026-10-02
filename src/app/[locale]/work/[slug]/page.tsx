import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getCaseBySlug } from '@/cms/cases';
import { excerpt } from '@/content/work';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { LOCALES } from '@/i18n/consts';
import { routing } from '@/i18n/routing';

const loadCase = cache(getCaseBySlug);

type CasePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const generateMetadata = async ({ params }: CasePageProps): Promise<Metadata> => {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const caseItem = await loadCase(locale, slug);

  if (!caseItem) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'work' });

  return {
    title: t('metaTitle', { title: caseItem.title }),
    description: excerpt(caseItem.task) || t('metaDescription', { title: caseItem.title }),
    alternates: {
      canonical: `/${locale}/work/${slug}`,
      languages: Object.fromEntries(LOCALES.map((item) => [item, `/${item}/work/${slug}`])),
    },
  };
};

const CasePage = async ({ params }: CasePageProps) => {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const design = await getDesign();
  const caseItem = await loadCase(locale, slug);

  if (!caseItem) {
    notFound();
  }

  return (
    <main>
      <DesignSection
        design={design}
        section="case"
        caseItem={caseItem}
      />
    </main>
  );
};

export default CasePage;
