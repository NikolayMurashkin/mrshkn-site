import type { BriefNiche } from '@/lib/brief/types';
import { COFFEE_DEMO_URL, DENTAL_DEMO_URL, EXPERT_DEMO_URL, SALON_DEMO_URL } from '@/lib/consts';

/** Тариф «Отраслевой сайт»: готовое демо студии, перенастроенное под бизнес клиента. */
export const INDUSTRY_PLAN_ID = 'industry';

/**
 * Отрасли, для которых демо уже готово, в порядке карточек на странице тарифа. Ключ — тексты карточки
 * `services.industry.niches.<id>`; ссылка «Открыть пример сайта» в карточке — демо отрасли, «Обсудить сайт» —
 * квиз с нишей отрасли из `INDUSTRY_NICHE_QUIZ`.
 */
export const INDUSTRY_NICHES = ['clinic', 'expert', 'horeca', 'beauty'] as const;

export const INDUSTRY_NICHE_DEMOS: Record<(typeof INDUSTRY_NICHES)[number], string> = {
  clinic: DENTAL_DEMO_URL,
  expert: EXPERT_DEMO_URL,
  horeca: COFFEE_DEMO_URL,
  beauty: SALON_DEMO_URL,
};

/** Ниша квиза у карточки отрасли: у салона своей ниши в квизе нет — «Кафе, бар, салон красоты». */
export const INDUSTRY_NICHE_QUIZ: Record<(typeof INDUSTRY_NICHES)[number], BriefNiche> = {
  clinic: 'clinic',
  expert: 'expert',
  horeca: 'horeca',
  beauty: 'horeca',
};

/** Опции, чьи цены «от» подставляются в тексты карточек ниш по их id: `{quiz}`, `{payments}`. */
export const INDUSTRY_NICHE_PRICE_OPTIONS: readonly string[] = ['quiz', 'payments'];

const isIndustryNiche = (id: string): id is (typeof INDUSTRY_NICHES)[number] =>
  (INDUSTRY_NICHES as readonly string[]).includes(id);

/** Квиз с тарифом и нишей квиза карточки; id не из `INDUSTRY_NICHES` уходит как есть — квиз чужую нишу не выберет. */
export const industryNicheHref = (locale: string, niche: string): string =>
  `/${locale}/brief?plan=${INDUSTRY_PLAN_ID}&niche=${isIndustryNiche(niche) ? INDUSTRY_NICHE_QUIZ[niche] : niche}`;
