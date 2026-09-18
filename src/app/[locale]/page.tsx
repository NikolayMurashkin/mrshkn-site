import { setRequestLocale } from 'next-intl/server';
import { DEFAULT_DESIGN } from '@/designs/consts';
import { getSection } from '@/designs/registry';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

const Hero = getSection(DEFAULT_DESIGN, 'hero');

const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
    </main>
  );
};

export default HomePage;
