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

/** Опция-апселл к любому тарифу: цена фиксированная, часть опций еще и с абонплатой. */
export type PricingOption = {
  id: string;
  price: PriceRange;
  /** Ежемесячная часть цены, если у опции есть обслуживание. */
  monthly?: PriceRange;
};

/** Позиция прайса вне таблицы тарифов: подписка на разработку и почасовая ставка. */
export type PricingExtra = {
  id: string;
  price: Money;
  period: PricePeriod;
};
