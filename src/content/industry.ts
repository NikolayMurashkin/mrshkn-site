import { COFFEE_DEMO_URL, DENTAL_DEMO_URL, EXPERT_DEMO_URL } from '@/lib/consts';

/** Тариф «Отраслевой сайт»: готовое демо студии, перенастроенное под бизнес клиента. */
export const INDUSTRY_PLAN_ID = 'industry';

/**
 * Отрасли, для которых демо уже готово, в порядке карточек на странице тарифа. Ключи — из справочника
 * ниш квиза: карточка открывает квиз с этой нишей, ссылка «Открыть демо» в ней — демо ниши.
 */
export const INDUSTRY_NICHES = ['clinic', 'expert', 'horeca'] as const;

export const INDUSTRY_NICHE_DEMOS: Record<(typeof INDUSTRY_NICHES)[number], string> = {
  clinic: DENTAL_DEMO_URL,
  expert: EXPERT_DEMO_URL,
  horeca: COFFEE_DEMO_URL,
};

export const industryNicheHref = (locale: string, niche: string): string =>
  `/${locale}/brief?plan=${INDUSTRY_PLAN_ID}&niche=${niche}`;
