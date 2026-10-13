import type { FaqItem, Service } from '@/content/types';

export type ServicePageProps = {
  /** Ключ тарифа из `PRICING_PLANS`: по нему выбираются услуга, тексты и цена. */
  service: string;
};

export type ServiceStep = {
  when: string;
  title: string;
  text: string;
};

export type ServiceBasics = {
  note: string;
  items: string[];
};

/** Карточка отрасли: готовое демо, ссылка ведет в квиз с предвыбранной нишей. */
export type ServiceNicheCard = {
  id: string;
  title: string;
  text: string;
  href: string;
};

/** Блоки, которые есть только у отраслевого тарифа: что меняем под клиента, что не входит, отрасли. */
export type ServiceIndustry = {
  included: ServiceBasics;
  excluded: ServiceBasics;
  niches: ServiceNicheCard[];
};

export type ServiceOptionView = {
  id: string;
  name: string;
  note: string;
  amount: string;
  monthly?: string;
};

export type ServicePageData = {
  service: Service;
  name: string;
  summary: string;
  term: string;
  price: string;
  cardAmount: string;
  priceKind: string;
  hasRevisions: boolean;
  cardPoints: string[];
  ownBasics: ServiceBasics | null;
  industry: ServiceIndustry | null;
  steps: ServiceStep[];
  faq: FaqItem[];
  options: ServiceOptionView[];
  backHref: string;
  briefHref: string;
  pricesHref: string;
};
