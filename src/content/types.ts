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

/** Тариф из прайса: строка таблицы услуг и страница услуги. */
export type PricingPlan = {
  /** Ключ тарифа: по нему лежат тексты в messages и уходит параметр `?plan=`. */
  id: string;
  /** Сегмент страницы услуги: ссылка ведет на `/<locale>/<slug>?plan=<id>`. */
  slug: string;
  /**
   * Своей страницы у тарифа нет: ссылка ведет на секцию с этим id на странице `slug` другой услуги,
   * без `?plan=`; в справочник страниц услуг тариф не попадает.
   */
  anchor?: string;
  price: Money;
  /** Цена «от»: точная сумма считается по объему работ. */
  isFrom: boolean;
  /** Срок в календарных днях: подпись срока собирается из числа, ключа `term` в переводах у тарифа нет. */
  days?: number;
  /**
   * Услуга не сайт и строки в таблице тарифов у нее нет: ее показывает строка «Сверх тарифа» со ссылкой
   * на страницу услуги; в квизе, на странице и в поиске тариф обычный.
   */
  outsideTable?: true;
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
  /** Часов нашей работы в месяц, которые входят в цену варианта; у варианта без часов поля нет. */
  hours?: number;
};

/** Опция-апселл к любому тарифу: разовая цена, без абонплаты. */
export type PricingOption = {
  id: string;
  price: PriceRange;
};

/** Тема базы тарифа: заголовок лежит в messages по `id`, пункты — ключи из `PRICING_BASICS`. */
export type PricingBasicGroup<TItem extends string> = {
  id: string;
  items: readonly TItem[];
};

/** Позиция прайса вне таблицы тарифов со своей ценой: подписка на разработку и почасовая ставка. */
export type PricingPricedExtra = {
  id: string;
  price: Money;
  period: PricePeriod;
};

/**
 * Позиция «Сверх тарифа», за которой стоит тариф со своей страницей: сумма, «от» и ссылка — из тарифа,
 * в строке они не повторяются.
 */
export type PricingPlanExtra = {
  id: string;
  planId: string;
};

export type PricingExtra = PricingPricedExtra | PricingPlanExtra;

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

/** Платеж на шкале процесса: предоплата, вторая оплата, последняя. */
export type ProcessPayment = 'prepayment' | 'second' | 'final';

/** Пауза на шкале процесса: заказчик смотрит работу, срок стоит. */
type ProcessPause = 'round1' | 'round2' | 'round3' | 'acceptance';

/** Отрезок шкалы «дни и паузы»: выбор стиля до дня 1, рабочий день или пауза; платеж — у части отрезков. */
export type ProcessScaleSegment =
  | { kind: 'style'; payment?: ProcessPayment }
  | { kind: 'day'; day: number; payment?: ProcessPayment }
  | { kind: 'pause'; pause: ProcessPause; payment?: ProcessPayment };
