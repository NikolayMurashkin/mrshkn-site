import type { Metadata } from 'next';
import { legalPageMetadata, renderLegalPage } from '@/lib/legal/page';

type HowWeWorkPageProps = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: HowWeWorkPageProps): Promise<Metadata> =>
  legalPageMetadata('howWeWork', params);

const HowWeWorkPage = async ({ params }: HowWeWorkPageProps) => renderLegalPage('howWeWork', params);

export default HowWeWorkPage;
