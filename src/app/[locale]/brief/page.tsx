import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { parseBriefPreset } from '@/lib/brief/preset';
import type { BriefPresetParams } from '@/lib/brief/types';
import { pageMetadata } from '@/lib/seo/metadata';

type BriefPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<BriefPresetParams>;
};

export const generateMetadata = async ({ params }: Pick<BriefPageProps, 'params'>): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'brief.meta' });

  return pageMetadata({ locale, path: BRIEF_HREF, title: t('title'), description: t('description') });
};

const BriefPage = async ({ params, searchParams }: BriefPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const { plan, niche } = parseBriefPreset(await searchParams);
  const design = await getDesign();

  return (
    <DesignSection
      design={design}
      section="brief"
      plan={plan}
      niche={niche}
    />
  );
};

export default BriefPage;
