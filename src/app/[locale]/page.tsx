import { setRequestLocale } from 'next-intl/server';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const design = await getDesign();

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
      <DesignSection
        design={design}
        section="process"
      />
    </main>
  );
};

export default HomePage;
