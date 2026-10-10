import { describe, expect, it } from 'vitest';
import { PRICING_PLANS } from '@/content/pricing';
import { LOCALES } from '@/i18n/consts';
import { SITE_URL } from '@/lib/consts';
import { organizationJsonLd, serviceJsonLd } from '@/lib/seo/json-ld';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type Messages = typeof ru;

type ServiceLd = {
  '@context'?: string;
  '@type'?: string;
  name?: string;
  description?: string;
  url?: string;
  provider?: { '@type'?: string; name?: string };
  offers?: {
    '@type'?: string;
    priceCurrency?: string;
    price?: number | string;
    priceSpecification?: { '@type'?: string; minPrice?: number | string };
  };
};

const MESSAGES: Record<string, Messages> = { ru, en: en as Messages };

const CURRENCY: Record<string, string> = { ru: 'RUB', en: 'USD' };

const ROWS = PRICING_PLANS.flatMap((plan) => LOCALES.map((locale) => [locale, plan.id] as const));

const planTexts = (locale: string, id: string) =>
  (MESSAGES[locale].pricing.plans as Record<string, { name: string; summary: string }>)[id];

describe('JSON-LD', () => {
  it('J1: Organization со schema.org, названием студии и адресом сайта', () => {
    const result = organizationJsonLd() as { '@context'?: string; '@type'?: string; name?: string; url?: string };

    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Organization');
    expect(result.name).toBe(ru.brand.name);
    expect(new URL(result.url ?? '').origin).toBe(new URL(SITE_URL).origin);
  });

  it.each(ROWS)('J2 %s, %s: Service с названием, описанием, адресом, исполнителем и ценой', (locale, id) => {
    const plan = PRICING_PLANS.find((item) => item.id === id)!;
    const { name, summary } = planTexts(locale, id);
    const amount = locale === 'en' ? plan.price.usd : plan.price.rub;
    const result = serviceJsonLd(MESSAGES[locale], id, locale) as ServiceLd | null;

    expect(result?.['@context']).toBe('https://schema.org');
    expect(result?.['@type']).toBe('Service');
    expect(result?.name).toBe(name);
    expect(result?.description).toBe(summary);
    expect(new URL(result?.url ?? '', SITE_URL).href).toBe(new URL(`/${locale}/${plan.slug}`, SITE_URL).href);
    expect(result?.provider?.['@type']).toBe('Organization');
    expect(result?.provider?.name).toBe('MRSHKN');
    expect(result?.offers?.['@type']).toBe('Offer');
    expect(result?.offers?.priceCurrency).toBe(CURRENCY[locale]);

    if (plan.isFrom) {
      expect(result?.offers?.priceSpecification?.['@type']).toBe('PriceSpecification');
      expect(Number(result?.offers?.priceSpecification?.minPrice)).toBe(amount);
    } else {
      expect(Number(result?.offers?.price)).toBe(amount);
    }
  });

  it('J3: неизвестная услуга — null', () => {
    expect(serviceJsonLd(ru, 'unknown', 'ru')).toBeNull();
  });
});
