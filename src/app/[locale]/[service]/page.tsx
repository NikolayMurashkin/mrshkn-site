import { hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { getServiceBySlug, SERVICES, serviceFaqJsonLd } from '@/content/services';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { serviceJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import type { SeoMessages } from '@/lib/seo/types';

export const dynamicParams = false;

type ServicePageRouteProps = {
  params: Promise<{ locale: string; service: string }>;
};

export const generateStaticParams = () =>
  routing.locales.flatMap((locale) => SERVICES.map((service) => ({ locale, service: service.slug })));

export const generateMetadata = async ({ params }: ServicePageRouteProps): Promise<Metadata> => {
  const { locale, service: slug } = await params;
  const service = getServiceBySlug(slug);

  if (!hasLocale(routing.locales, locale) || !service) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'pricing.plans' });

  return pageMetadata({
    locale,
    path: `/${service.slug}`,
    title: t(`${service.id}.name`),
    description: t(`${service.id}.summary`),
  });
};

const ServiceRoute = async ({ params }: ServicePageRouteProps) => {
  const { locale, service: slug } = await params;
  const service = getServiceBySlug(slug);

  if (!hasLocale(routing.locales, locale) || !service) {
    notFound();
  }

  setRequestLocale(locale);

  const design = await getDesign();
  const messages = (await getMessages({ locale })) as unknown as SeoMessages;
  const offer = serviceJsonLd(messages, service.id, locale);
  const faq = serviceFaqJsonLd(messages, service.id);

  return (
    <main>
      {offer ? <JsonLd data={offer} /> : null}
      {faq ? <JsonLd data={faq} /> : null}
      <DesignSection
        design={design}
        section="servicePage"
        service={service.id}
      />
    </main>
  );
};

export default ServiceRoute;
