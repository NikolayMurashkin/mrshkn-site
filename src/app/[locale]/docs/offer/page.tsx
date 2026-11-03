import type { Metadata } from 'next';
import { legalPageMetadata, renderLegalPage } from '@/lib/legal/page';

type OfferPageProps = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: OfferPageProps): Promise<Metadata> =>
  legalPageMetadata('offer', params);

const OfferPage = async ({ params }: OfferPageProps) => renderLegalPage('offer', params);

export default OfferPage;
