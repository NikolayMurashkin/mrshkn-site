import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getCases } from '@/cms/cases';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const design = await getDesign();
  const cases = await getCases(locale);

  return (
    <main>
      <DesignSection
        design={design}
        section="hero"
      />
      <DesignSection
        design={design}
        section="pricing"
      />
      {cases.length > 0 ? (
        <DesignSection
          design={design}
          section="works"
          cases={cases}
        />
      ) : null}
      <DesignSection
        design={design}
        section="process"
      />
    </main>
  );
};

export default HomePage;
