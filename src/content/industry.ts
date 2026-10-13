/** Тариф «Отраслевой сайт»: готовое демо студии, перенастроенное под бизнес клиента. */
export const INDUSTRY_PLAN_ID = 'industry';

/**
 * Отрасли, для которых демо уже готово, в порядке карточек на странице тарифа. Ключи — из справочника
 * ниш квиза: карточка открывает квиз с этой нишей. Ссылок на сами демо нет — их адреса пока не отвечают.
 */
export const INDUSTRY_NICHES = ['clinic', 'expert', 'horeca'] as const;

export const industryNicheHref = (locale: string, niche: string): string =>
  `/${locale}/brief?plan=${INDUSTRY_PLAN_ID}&niche=${niche}`;
