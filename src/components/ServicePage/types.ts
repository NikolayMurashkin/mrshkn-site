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

/** Карточка отрасли: готовое демо, ссылка ведет в квиз с предвыбранной нишей, `demoHref` — само демо. */
export type ServiceNicheCard = {
  id: string;
  title: string;
  text: string;
  href: string;
  demoHref: string;
};

export type TryItMessenger = 'telegram' | 'max';

export type TryItApp = {
  id: string;
  links: readonly { messenger: TryItMessenger; href: string }[];
};

export type ServiceTryItLink = {
  messenger: TryItMessenger;
  href: string;
  label: string;
};

export type ServiceTryItCard = {
  id: string;
  title: string;
  module: string;
  text: string;
  links: ServiceTryItLink[];
};

/** Раздел «Попробовать» страницы Mini App: демо-приложения студии в мессенджерах. */
export type ServiceTryIt = {
  heading: string;
  note: string;
  mark: string;
  apps: ServiceTryItCard[];
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
  /**
   * Вид цены — надзаголовок карточки там, где он есть в DS направления.
   * У ежемесячного варианта его нет: «ежемесячно» уже сказано сроком карточки.
   */
  kind: string | null;
  /** Что входит в вариант: список карточки там, где он есть в DS направления; у варианта без списка — пустой. */
  points: string[];
  href: string;
  /** Подпись ссылки в квиз с этим вариантом. */
  cta: string;
};

/** Варианты тарифа карточками: у 3D — два формата, у поддержки — хостинг и три уровня с часами. */
export type ServiceTiers = {
  heading: string;
  note: string;
  items: ServiceTierCard[];
};

/** Блоки, которые есть только у «3D-интерактива»: ролик или постер, варианты, условия, что нужно от клиента. */
export type ServiceThreeD = {
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
  tiers: ServiceTiers | null;
  threeD: ServiceThreeD | null;
  tryIt: ServiceTryIt | null;
  /** «Посмотреть пример» в шапке страницы; `null` — у услуги примера нет. */
  exampleHref: string | null;
  steps: ServiceStep[];
  faq: FaqItem[];
  options: ServiceOptionView[];
  backHref: string;
  briefHref: string;
  pricesHref: string;
};
