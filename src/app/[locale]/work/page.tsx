import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCases } from '@/cms/cases';
import { WORK_PAGE_PATH } from '@/content/work';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { pageMetadata } from '@/lib/seo/metadata';

type WorkPageProps = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: WorkPageProps): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'work' });

  return pageMetadata({
    locale,
    path: WORK_PAGE_PATH,
    title: t('pageTitle'),
    description: t('pageDescription'),
  });
};

/** Все опубликованные кейсы сеткой карточек направления; без кейсов страницы нет — как и секции на главной. */
const WorkPage = async ({ params }: WorkPageProps) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const design = await getDesign();
  const cases = await getCases(locale);

  if (cases.length === 0) {
    notFound();
  }

  return (
    <main>
      <DesignSection
        design={design}
        section="works"
        variant="page"
        cases={cases}
      />
    </main>
  );
};

export default WorkPage;
