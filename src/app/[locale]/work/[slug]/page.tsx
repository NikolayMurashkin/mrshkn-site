import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getCaseBySlug } from '@/cms/cases';
import { caseHref, excerpt } from '@/content/work';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo/metadata';

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

  return pageMetadata({
    locale,
    path: caseHref(slug),
    title: t('metaTitle', { title: caseItem.title }),
    description: excerpt(caseItem.task) || t('metaDescription', { title: caseItem.title }),
  });
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
