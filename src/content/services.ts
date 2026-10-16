import { PRICING_PLANS } from './pricing';
import { SERVICE_OPTIONS } from './consts';
import type { FaqItem, FaqJsonLd, PricingTier, Service, ServiceMessages } from './types';

export const SERVICES: Service[] = PRICING_PLANS.map((plan) => ({
  id: plan.id,
  slug: plan.slug,
  options: SERVICE_OPTIONS[plan.id] ?? [],
}));

export const getServiceBySlug = (slug: string): Service | undefined =>
  SERVICES.find((service) => service.slug === slug);

export const serviceBriefHref = (locale: string, service: Service): string => `/${locale}/brief?plan=${service.id}`;

/** Кнопка варианта ведет в квиз с самим вариантом: квиз выберет его тариф, а вариант уйдет в заявку. */
export const tierBriefHref = (locale: string, tier: PricingTier): string => `/${locale}/brief?plan=${tier.id}`;

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

export const filledFaq = (items: readonly FaqItem[] | undefined): FaqItem[] =>
  (items ?? []).filter((item) => hasText(item?.question) && hasText(item?.answer));

export const serviceFaqJsonLd = (messages: ServiceMessages, serviceId: string): FaqJsonLd | null => {
  const items = filledFaq(messages.services?.[serviceId]?.faq);

  if (items.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
};
