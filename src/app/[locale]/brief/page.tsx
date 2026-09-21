import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Brief } from '@/components/Brief/Brief';
import { getDesign } from '@/designs/server';
import { BRIEF_HREF, BRIEF_STEP_VALUES } from '@/lib/brief/consts';

type BriefPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string }>;
};

export const generateMetadata = async ({ params }: Pick<BriefPageProps, 'params'>): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brief.meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: `/${locale}${BRIEF_HREF}` },
  };
};

const BriefPage = async ({ params, searchParams }: BriefPageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const { plan } = await searchParams;
  const design = await getDesign();

  return (
    <Brief
      design={design}
      plan={plan && BRIEF_STEP_VALUES.product.includes(plan) ? plan : null}
    />
  );
};

export default BriefPage;
