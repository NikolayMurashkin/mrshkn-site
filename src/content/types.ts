/** Сумма в двух валютах: рубли для RU-страницы, доллары для EN. */
export type Money = {
  rub: number;
  usd: number;
};

/** Вилка цены: у опций она чаще всего «от и до», у тарифов — одна сумма. */
export type PriceRange = {
  from: Money;
  to?: Money;
};

/** За что платят вне таблицы тарифов: разово, ежемесячно или почасово. */
export type PricePeriod = 'once' | 'month' | 'hour';

/** Тариф из прайса: строка таблицы услуг и будущая страница услуги. */
export type PricingPlan = {
  /** Ключ тарифа: по нему лежат тексты в messages и уходит параметр `?plan=`. */
  id: string;
  /** Сегмент страницы услуги: ссылка ведет на `/<locale>/<slug>?plan=<id>`. */
  slug: string;
  price: Money;
  /** Цена «от»: точная сумма считается по объему работ. */
  isFrom: boolean;
};

/** Цена тарифа или его варианта: подпись собирается одним кодом, «от» — по `isFrom`. */
export type PricedItem = Pick<PricingPlan, 'price' | 'isFrom'>;

/** Вариант тарифа со своей ценой: у одной страницы услуги несколько карточек с разными суммами. */
export type PricingTier = {
  /** Ключ варианта: по нему тексты в messages и параметр `?plan=` кнопки варианта. */
  id: string;
  /** Ключ тарифа из `PRICING_PLANS`, к которому относится вариант. */
  planId: string;
  price: Money;
  isFrom: boolean;
};

/** Опция-апселл к любому тарифу: цена фиксированная, часть опций еще и с абонплатой. */
export type PricingOption = {
  id: string;
  price: PriceRange;
  /** Ежемесячная часть цены, если у опции есть обслуживание. */
  monthly?: PriceRange;
};

/** Цена опции двумя частями: разовая сумма и абонплата печатаются разными строками. */
export type OptionPriceText = {
  amount: string;
  /** Готовая подпись абонплаты вида «+ 3 000 ₽ / мес»; у опций без обслуживания ее нет. */
  monthly?: string;
};

/** Тема базы тарифа: заголовок лежит в messages по `id`, пункты — ключи из `PRICING_BASICS`. */
export type PricingBasicGroup<TItem extends string> = {
  id: string;
  items: readonly TItem[];
};

/** Позиция прайса вне таблицы тарифов: подписка на разработку и почасовая ставка. */
export type PricingExtra = {
  id: string;
  price: Money;
  period: PricePeriod;
};

/** Страница услуги: тариф из прайса, его адрес и опции, которые показываются на странице. */
export type Service = {
  /** Ключ тарифа из `PRICING_PLANS`: по нему тексты в messages и предвыбор в квизе. */
  id: string;
  /** Сегмент адреса страницы, тот же, что у тарифа. */
  slug: string;
  /** Опции этой услуги — ключи из `PRICING_OPTIONS`. */
  options: readonly string[];
};

/** Кадр-постер в двух форматах: AVIF для тех, кто умеет, WebP — всем остальным. */
export type ThreeDPoster = {
  avif: string;
  webp: string;
  width: number;
  height: number;
};

/** Постеры по ориентации: горизонтальный для широких экранов, вертикальный для телефонов. */
export type ThreeDPosters = Record<'wide' | 'tall', ThreeDPoster>;

/** Ролик демо по ориентации, как у постеров. */
export type ThreeDVideo = Record<'wide' | 'tall', string>;

/** Вопрос и ответ FAQ услуги из файла переводов. */
export type FaqItem = {
  question: string;
  answer: string;
};

/** JSON-LD `FAQPage` страницы услуги (D13). */
export type FaqJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }[];
};

/** Часть файла переводов, из которой собирается FAQ услуги. */
export type ServiceMessages = {
  services?: Record<string, { faq?: FaqItem[] } | undefined>;
};
