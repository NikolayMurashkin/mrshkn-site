import { formatDays, formatMoney } from './format';
import { PRICING_PLANS, PRICING_TIERS } from './pricing';
import { SERVICE_OPTIONS } from './consts';
import type { FaqItem, FaqJsonLd, PricingTier, Service, ServiceMessages } from './types';

/** Тарифы со своей страницей услуги: тариф с `anchor` ведет на секцию чужой страницы. */
export const SERVICE_PLANS = PRICING_PLANS.filter((plan) => plan.anchor === undefined);

export const SERVICES: Service[] = SERVICE_PLANS.map((plan) => ({
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

/**
 * Подстановки в тексте шага и ответа FAQ услуги: `{term}` — срок тарифа в днях, `{<id варианта>}` — сумма
 * варианта тарифа. Значения — из прайса, поэтому цифр в переводе нет;
 * неизвестная подстановка остается как есть — ее ловит тест FAQ.
 */
export const fillServiceText = (text: string, serviceId: string, locale: string) => {
  const plan = PRICING_PLANS.find((item) => item.id === serviceId);

  if (!plan) {
    return text;
  }

  const values: Record<string, string> = Object.fromEntries(
    PRICING_TIERS.filter((tier) => tier.planId === plan.id).map((tier) => [tier.id, formatMoney(tier.price, locale)]),
  );

  if (plan.days !== undefined) {
    values.term = formatDays(plan.days, locale);
  }

  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
};

/** Пары FAQ услуги с подставленными сроком и ценами: одни и те же на странице, в JSON-LD и в `llms-full.txt`. */
export const serviceFaq = (items: readonly FaqItem[] | undefined, serviceId: string, locale: string): FaqItem[] =>
  filledFaq(items).map((item) => ({ ...item, answer: fillServiceText(item.answer, serviceId, locale) }));

export const serviceFaqJsonLd = (messages: ServiceMessages, serviceId: string, locale: string): FaqJsonLd | null => {
  const items = serviceFaq(messages.services?.[serviceId]?.faq, serviceId, locale);

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
