import type { FaqItem, Money, PricingPlan } from '@/content/types';
import type { SiteLocale } from '@/i18n/types';

/** Тексты тарифа из `pricing.plans.<id>`: у тарифа со сроком в днях `term` нет. */
export type PlanTexts = { name: string; summary: string; term?: string };

/** Часть файла переводов, из которой собираются метаданные, JSON-LD и `llms.txt`. */
export type SeoMessages = {
  brand: { name: string };
  meta: { title: string; description: string };
  nav: { services: string };
  brief: { meta: { title: string; description: string } };
  pricing: {
    plans: Record<string, PlanTexts | undefined>;
    price: { exact: string; from: string };
    columns: { term: string; price: string };
  };
  servicePage: { faqHeading: string };
  services: Record<string, { faq?: FaqItem[] } | undefined>;
};

/** Валюта цены на странице языка: код ISO 4217 и поле суммы в `Money`. */
export type PriceCurrency = { code: string; amount: keyof Money };

/** Ссылка на организацию из других узлов JSON-LD. */
export type OrganizationRef = {
  '@type': 'Organization';
  '@id': string;
  name: string;
  url: string;
};

/** Место, где студия берет заказы: город или регион schema.org. */
export type ServedArea = { '@type': 'City' | 'AdministrativeArea'; name: string };

export type OrganizationJsonLd = OrganizationRef & {
  '@context': 'https://schema.org';
  email: string;
  logo: string;
  areaServed: ServedArea[];
};

type PriceSpecification = {
  '@type': 'PriceSpecification';
  minPrice: number;
  priceCurrency: string;
};

/** Цена тарифа: точная — `price`, «от» — нижняя граница в `priceSpecification`. */
export type ServiceOffer =
  | { '@type': 'Offer'; price: number; priceCurrency: string }
  | { '@type': 'Offer'; priceCurrency: string; priceSpecification: PriceSpecification };

export type ServiceJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  url: string;
  provider: OrganizationRef;
  offers: ServiceOffer;
};

/** Карточка OG-картинки: плашка сверху, крупный заголовок, подпись. */
export type OgCardViewProps = {
  kicker?: string;
  title: string;
  description?: string;
};

/** Обработчик текстового файла: запрос не читает, принимает его ради сигнатуры маршрута. */
export type TextRoute = (request?: Request) => Promise<Response>;

/** Тексты одного языка: разделы `llms.txt` идут в порядке массива, первым — язык по умолчанию. */
export type LocaleMessages = { locale: SiteLocale; messages: SeoMessages };

/** Тариф прайса вместе с его текстами на языке раздела. */
export type PlanEntry = { plan: PricingPlan; texts: PlanTexts };

/** Метаданные страницы: язык, путь и тексты для canonical, hreflang, Open Graph и карточки X. */
export type PageSeo = {
  locale: SiteLocale;
  /** Путь страницы без префикса языка, главная — пустая строка. */
  path: string;
  title: string;
  description: string;
};

/** Пропсы `opengraph-image` сегмента: параметры адреса от корня до сегмента. */
export type OgImageProps<TParams> = { params: Promise<TParams> };

/** Перевод подписи цены из `pricing.price`. */
export type PriceTranslate = (key: 'exact' | 'from', values: { amount: string }) => string;
