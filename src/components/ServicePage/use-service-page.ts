'use client';

import { useLocale, useTranslations } from 'next-intl';
import { SERVICE_BACK_ANCHOR, SERVICE_PRICES_ANCHOR } from '@/content/consts';
import {
  INDUSTRY_NICHE_DEMOS,
  INDUSTRY_NICHE_PRICE_OPTIONS,
  INDUSTRY_NICHES,
  INDUSTRY_PLAN_ID,
  industryNicheHref,
} from '@/content/industry';
import { fillServiceText, SERVICES, serviceBriefHref, serviceFaq, tierBriefHref } from '@/content/services';
import { PRICING_OPTIONS, PRICING_PLANS, PRICING_TIERS } from '@/content/pricing';
import {
  THREE_D_PLAN_ID,
  THREE_D_VIDEOS,
  THREE_D_WEBGL_SOURCE,
  threeDDemoHref,
  threeDPosters,
} from '@/content/three-d';
import type { FaqItem } from '@/content/types';
import { usePriceText } from '@/content/use-price';
import {
  CARD_POINT_KEYS,
  MINI_APP_PLAN_ID,
  MONTHLY_SERVICES,
  OWN_BASICS_SERVICES,
  SERVICE_CARD_POINTS,
  SERVICE_EXAMPLES,
  SERVICES_WITHOUT_REVISIONS,
  SUPPORT_PLAN_ID,
  TRY_IT_APPS,
} from './consts';
import type {
  ServiceBasics,
  ServiceIndustry,
  ServicePageData,
  ServiceStep,
  ServiceThreeD,
  ServiceTiers,
  ServiceTryIt,
} from './types';

/** Строка про поддержку после гарантии — последним пунктом условий: цена берется из прайса, не из текста. */
const withAfterWarranty = (terms: ServiceBasics, line: string | null): ServiceBasics =>
  line ? { ...terms, items: [...terms.items, line] } : terms;

export const useServicePage = (serviceId: string): ServicePageData | null => {
  const locale = useLocale();
  const t = useTranslations('servicePage');
  const root = useTranslations();
  const texts = useTranslations('services');
  const plans = useTranslations('pricing.plans');
  const optionTexts = useTranslations('pricing.options');
  const tierTexts = useTranslations('pricing.tiers');
  const price = usePriceText();
  const service = SERVICES.find((item) => item.id === serviceId);
  const plan = PRICING_PLANS.find((item) => item.id === serviceId);

  if (!service || !plan) {
    return null;
  }

  const hasRevisions = !SERVICES_WITHOUT_REVISIONS.includes(service.id);
  const isMonthly = MONTHLY_SERVICES.includes(service.id);
  const planPrice = price.plan(plan);
  const supportPlan = PRICING_PLANS.find((item) => item.id === SUPPORT_PLAN_ID);
  const nichePrices = Object.fromEntries(
    PRICING_OPTIONS.filter((option) => INDUSTRY_NICHE_PRICE_OPTIONS.includes(option.id)).map((option) => [
      option.id,
      price.optionFrom(option),
    ]),
  );
  const industry: ServiceIndustry | null =
    service.id === INDUSTRY_PLAN_ID
      ? {
          included: texts.raw(`${service.id}.included`) as ServiceBasics,
          excluded: texts.raw(`${service.id}.excluded`) as ServiceBasics,
          niches: INDUSTRY_NICHES.map((niche) => ({
            id: niche,
            title: texts(`${service.id}.niches.${niche}.title`),
            text: texts(`${service.id}.niches.${niche}.text`, nichePrices),
            href: industryNicheHref(locale, niche),
            demoHref: INDUSTRY_NICHE_DEMOS[niche],
          })),
        }
      : null;
  const planTiers = PRICING_TIERS.filter((tier) => tier.planId === service.id);
  const tiers: ServiceTiers | null =
    planTiers.length > 0
      ? {
          heading: t(`${service.id}.tiersHeading`),
          note: t(`${service.id}.tiersNote`),
          items: planTiers.map((tier) => {
            const name = tierTexts(`${tier.id}.name`);
            const pointsKey = `${service.id}.tierPoints.${tier.id}`;

            return {
              id: tier.id,
              name,
              summary: tierTexts(`${tier.id}.summary`),
              term: tierTexts(`${tier.id}.term`),
              price: price.plan(tier),
              kind: isMonthly ? null : t(`priceKind.${tier.isFrom ? 'from' : 'exact'}`),
              points: texts.has(pointsKey) ? (texts.raw(pointsKey) as string[]) : [],
              href: tierBriefHref(locale, tier),
              cta: t(`${service.id}.tierCta`, { name }),
            };
          }),
        }
      : null;
  const threeD: ServiceThreeD | null =
    service.id === THREE_D_PLAN_ID
      ? {
          terms: withAfterWarranty(
            texts.raw(`${service.id}.terms`) as ServiceBasics,
            supportPlan
              ? texts(`${service.id}.afterWarranty`, { price: t('perMonth', { price: price.plan(supportPlan) }) })
              : null,
          ),
          needs: texts.raw(`${service.id}.needs`) as ServiceBasics,
          model: texts(`${service.id}.model`),
          posters: threeDPosters(locale),
          video: THREE_D_VIDEOS[locale] ?? null,
          demoHref: threeDDemoHref(locale),
          webglSource: THREE_D_WEBGL_SOURCE,
        }
      : null;

  const tryIt: ServiceTryIt | null =
    service.id === MINI_APP_PLAN_ID
      ? {
          heading: t('tryIt.heading'),
          note: t('tryIt.note'),
          mark: t('tryIt.mark'),
          apps: TRY_IT_APPS.map((app) => ({
            id: app.id,
            title: t(`tryIt.apps.${app.id}.title`),
            module: t(`tryIt.apps.${app.id}.module`),
            text: t(`tryIt.apps.${app.id}.text`),
            links: app.links.map((link) => ({ ...link, label: t(`tryIt.${link.messenger}`) })),
          })),
        }
      : null;

  return {
    service,
    name: plans(`${service.id}.name`),
    summary: plans(`${service.id}.summary`),
    term: price.term(plan),
    price: isMonthly ? t('perMonth', { price: planPrice }) : planPrice,
    cardAmount: planPrice,
    priceKind: t(`priceKind.${isMonthly ? 'month' : plan.isFrom ? 'from' : 'exact'}`),
    hasRevisions,
    cardPoints: (SERVICE_CARD_POINTS[service.id] ?? SERVICE_CARD_POINTS.default).map((point) =>
      root(CARD_POINT_KEYS[point]),
    ),
    ownBasics: OWN_BASICS_SERVICES.includes(service.id) ? (texts.raw(`${service.id}.basics`) as ServiceBasics) : null,
    industry,
    tiers,
    threeD,
    tryIt,
    exampleHref: SERVICE_EXAMPLES[service.id] ?? null,
    steps: (texts.raw(`${service.id}.process`) as ServiceStep[]).map((step) => ({
      ...step,
      text: fillServiceText(step.text, service.id, locale),
    })),
    faq: serviceFaq(texts.raw(`${service.id}.faq`) as FaqItem[], service.id, locale),
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
