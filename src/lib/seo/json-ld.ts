import { planPath } from '@/content/format';
import { PRICING_PLANS } from '@/content/pricing';
import type { SiteLocale } from '@/i18n/types';
import { SITE_URL } from '@/lib/consts';
import { localePath } from './alternates';
import { AREA_SERVED, BRAND_NAME, LOGO_PATH, ORGANIZATION_ID, PRICE_CURRENCY, STUDIO_EMAIL } from './consts';
import type { OrganizationRef, OrganizationJsonLd, SeoMessages, ServiceJsonLd, ServiceOffer } from './types';

const organizationRef = (name: string): OrganizationRef => ({
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name,
  url: SITE_URL,
});

/**
 * Студия для schema.org: только то, что есть на самом деле, — без телефона, адреса и соцсетей. Офиса нет,
 * поэтому город и область — в `areaServed`, где студия берет заказы, а не в `address`.
 */
export const organizationJsonLd = (locale: SiteLocale): OrganizationJsonLd => ({
  '@context': 'https://schema.org',
  ...organizationRef(BRAND_NAME),
  email: STUDIO_EMAIL,
  logo: `${SITE_URL}${LOGO_PATH}`,
  areaServed: AREA_SERVED[locale],
});

/** Услуга из прайса на языке страницы: цена в валюте языка, «от» — нижней границей. */
export const serviceJsonLd = (
  messages: Pick<SeoMessages, 'brand' | 'pricing'>,
  serviceId: string,
  locale: SiteLocale,
): ServiceJsonLd | null => {
  const plan = PRICING_PLANS.find((item) => item.id === serviceId);
  const texts = messages.pricing.plans[serviceId];

  if (!plan || !texts) {
    return null;
  }

  const currency = PRICE_CURRENCY[locale];
  const amount = plan.price[currency.amount];
  const offers: ServiceOffer = plan.isFrom
    ? {
        '@type': 'Offer',
        priceCurrency: currency.code,
        priceSpecification: { '@type': 'PriceSpecification', minPrice: amount, priceCurrency: currency.code },
      }
    : { '@type': 'Offer', price: amount, priceCurrency: currency.code };

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: texts.name,
    description: texts.summary,
    url: `${SITE_URL}${localePath(locale, plan.anchor === undefined ? `/${plan.slug}` : planPath(plan))}`,
    provider: organizationRef(messages.brand.name),
    offers,
  };
};
