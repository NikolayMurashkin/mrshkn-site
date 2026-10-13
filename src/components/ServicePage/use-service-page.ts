'use client';

import { useLocale, useTranslations } from 'next-intl';
import { SERVICE_BACK_ANCHOR, SERVICE_PRICES_ANCHOR } from '@/content/consts';
import { INDUSTRY_NICHES, INDUSTRY_PLAN_ID, industryNicheHref } from '@/content/industry';
import { filledFaq, SERVICES, serviceBriefHref } from '@/content/services';
import { PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import type { FaqItem } from '@/content/types';
import { usePriceText } from '@/content/use-price';
import { CARD_POINT_KEYS, MONTHLY_SERVICES, SERVICE_CARD_POINTS, SERVICES_WITHOUT_REVISIONS } from './consts';
import type { ServiceBasics, ServiceIndustry, ServicePageData, ServiceStep } from './types';

export const useServicePage = (serviceId: string): ServicePageData | null => {
  const locale = useLocale();
  const t = useTranslations('servicePage');
  const root = useTranslations();
  const texts = useTranslations('services');
  const plans = useTranslations('pricing.plans');
  const optionTexts = useTranslations('pricing.options');
  const price = usePriceText();
  const service = SERVICES.find((item) => item.id === serviceId);
  const plan = PRICING_PLANS.find((item) => item.id === serviceId);

  if (!service || !plan) {
    return null;
  }

  const hasRevisions = !SERVICES_WITHOUT_REVISIONS.includes(service.id);
  const isMonthly = MONTHLY_SERVICES.includes(service.id);
  const planPrice = price.plan(plan);
  const industry: ServiceIndustry | null =
    service.id === INDUSTRY_PLAN_ID
      ? {
          included: texts.raw(`${service.id}.included`) as ServiceBasics,
          excluded: texts.raw(`${service.id}.excluded`) as ServiceBasics,
          niches: INDUSTRY_NICHES.map((niche) => ({
            id: niche,
            title: texts(`${service.id}.niches.${niche}.title`),
            text: texts(`${service.id}.niches.${niche}.text`),
            href: industryNicheHref(locale, niche),
          })),
        }
      : null;

  return {
    service,
    name: plans(`${service.id}.name`),
    summary: plans(`${service.id}.summary`),
    term: plans(`${service.id}.term`),
    price: isMonthly ? t('perMonth', { price: planPrice }) : planPrice,
    cardAmount: planPrice,
    priceKind: t(`priceKind.${isMonthly ? 'month' : plan.isFrom ? 'from' : 'exact'}`),
    hasRevisions,
    cardPoints: (SERVICE_CARD_POINTS[service.id] ?? SERVICE_CARD_POINTS.default).map((point) =>
      root(CARD_POINT_KEYS[point]),
    ),
    ownBasics: isMonthly ? (texts.raw(`${service.id}.basics`) as ServiceBasics) : null,
    industry,
    steps: texts.raw(`${service.id}.process`) as ServiceStep[],
    faq: filledFaq(texts.raw(`${service.id}.faq`) as FaqItem[]),
    options: service.options.flatMap((id) => {
      const option = PRICING_OPTIONS.find((item) => item.id === id);

      if (!option) {
        return [];
      }

      const { amount, monthly } = price.option(option);

      return [{ id, name: optionTexts(`${id}.name`), note: optionTexts(`${id}.note`), amount, monthly }];
    }),
    backHref: `/${locale}#${SERVICE_BACK_ANCHOR}`,
    briefHref: serviceBriefHref(locale, service),
    pricesHref: `/${locale}#${SERVICE_PRICES_ANCHOR}`,
  };
};
