import type { FaqItem, Service, ThreeDPosters, ThreeDVideo } from '@/content/types';

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

/** Карточка варианта тарифа: своя цена и срок, кнопка ведет в квиз с этим вариантом. */
export type ServiceTierCard = {
  id: string;
  name: string;
  summary: string;
  term: string;
  price: string;
  /** Вид цены — надзаголовок карточки там, где он есть в DS направления. */
  kind: string;
  /** Что входит в вариант: список карточки там, где он есть в DS направления. */
  points: string[];
  href: string;
};

/** Блоки, которые есть только у «3D-интерактива»: ролик или постер, варианты, условия, что нужно от клиента. */
export type ServiceThreeD = {
  tiers: ServiceTierCard[];
  terms: ServiceBasics;
  needs: ServiceBasics;
  /** Модель с нуля — отдельной строкой сметы. */
  model: string;
  posters: ThreeDPosters;
  /** null — ролика на этом языке нет, остается постер. */
  video: ThreeDVideo | null;
  demoHref: string;
  webglSource: string;
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
  threeD: ServiceThreeD | null;
  steps: ServiceStep[];
  faq: FaqItem[];
  options: ServiceOptionView[];
  backHref: string;
  briefHref: string;
  pricesHref: string;
};
