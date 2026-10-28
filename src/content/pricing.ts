import type { PricingBasicGroup, PricingExtra, PricingOption, PricingPlan, PricingTier } from './types';

/**
 * Единственный источник цен на сайте. Рубли назначил Николай по медианам рынка Калининградской области;
 * доллары — таблица «Линейка» из бизнес-плана (`docs/studio-plan.html`), кроме лендинга ($2 400) и позиций,
 * которых в бизнес-плане нет: их доллары пересчитаны из рублей по курсу 50 ₽, как и цены опций.
 * Отраслевой сайт — первой строкой, как самый быстрый и доступный вход. Срок `days` — календарные дни
 * с паузами на ответ заказчика; у тарифов «от» срок — строкой перевода.
 */
export const PRICING_PLANS: PricingPlan[] = [
  { id: 'industry', slug: 'industry', price: { rub: 70_000, usd: 1_200 }, isFrom: false, days: 7 },
  { id: 'landing', slug: 'landing', price: { rub: 50_000, usd: 2_400 }, isFrom: false, days: 4 },
  {
    id: 'industryMiniApp',
    slug: 'mini-app',
    anchor: 'ready',
    price: { rub: 90_000, usd: 1_800 },
    isFrom: false,
    days: 7,
  },
  { id: 'business', slug: 'business', price: { rub: 180_000, usd: 4_500 }, isFrom: false, days: 14 },
  { id: 'miniApp', slug: 'mini-app', price: { rub: 180_000, usd: 3_500 }, isFrom: true },
  { id: 'store', slug: 'store', price: { rub: 250_000, usd: 8_000 }, isFrom: true },
  { id: 'mvp', slug: 'mvp', price: { rub: 300_000, usd: 12_000 }, isFrom: true },
  { id: 'threeD', slug: '3d', price: { rub: 250_000, usd: 4_900 }, isFrom: true },
  { id: 'support', slug: 'support', price: { rub: 7_000, usd: 140 }, isFrom: true },
];

/**
 * Варианты тарифа со своей ценой: в таблице и квизе тариф один, на его странице — карточка на вариант,
 * а выбранный вариант уходит в заявку. Цены 3D и уровней поддержки в обеих валютах назначил Николай.
 */
export const PRICING_TIERS: PricingTier[] = [
  { id: 'block3d', planId: 'threeD', price: { rub: 250_000, usd: 4_900 }, isFrom: true },
  { id: 'landing3d', planId: 'threeD', price: { rub: 350_000, usd: 7_300 }, isFrom: true },
  { id: 'hostingBackups', planId: 'support', price: { rub: 7_000, usd: 140 }, isFrom: false },
  { id: 'supportHours', planId: 'support', price: { rub: 15_000, usd: 250 }, isFrom: false, hours: 3 },
  { id: 'supportHoursPlus', planId: 'support', price: { rub: 35_000, usd: 700 }, isFrom: false, hours: 10 },
  { id: 'supportHoursPro', planId: 'support', price: { rub: 70_000, usd: 1_400 }, isFrom: false, hours: 25 },
];

export const PRICING_OPTIONS: PricingOption[] = [
  { id: 'booking', price: { from: { rub: 15_000, usd: 300 }, to: { rub: 40_000, usd: 800 } } },
  { id: 'payments', price: { from: { rub: 15_000, usd: 300 }, to: { rub: 25_000, usd: 500 } } },
  { id: 'quiz', price: { from: { rub: 20_000, usd: 400 } } },
  { id: 'calculator', price: { from: { rub: 25_000, usd: 500 }, to: { rub: 40_000, usd: 800 } } },
  { id: 'reviews', price: { from: { rub: 10_000, usd: 200 }, to: { rub: 15_000, usd: 300 } } },
  { id: 'messengers', price: { from: { rub: 8_000, usd: 160 }, to: { rub: 15_000, usd: 300 } } },
  { id: 'assistant', price: { from: { rub: 40_000, usd: 800 }, to: { rub: 60_000, usd: 1_200 } } },
  { id: 'language', price: { from: { rub: 20_000, usd: 400 } } },
  { id: 'blog', price: { from: { rub: 25_000, usd: 500 } } },
  { id: 'crm', price: { from: { rub: 15_000, usd: 300 }, to: { rub: 30_000, usd: 600 } } },
  { id: 'branches', price: { from: { rub: 15_000, usd: 300 } } },
  { id: 'catalog', price: { from: { rub: 20_000, usd: 400 }, to: { rub: 35_000, usd: 700 } } },
  { id: 'geo', price: { from: { rub: 30_000, usd: 600 } } },
];

/** Второй мессенджер у отраслевого Mini App: опция только этого тарифа, в «опциях к любому тарифу» ее нет. */
export const MAX_OPTION: PricingOption = { id: 'max', price: { from: { rub: 15_000, usd: 300 } } };

export const PRICING_EXTRAS: PricingExtra[] = [
  { id: 'subscription', price: { rub: 180_000, usd: 3_500 }, period: 'month' },
  { id: 'hour', price: { rub: 3_000, usd: 90 }, period: 'hour' },
];

/** Что входит в любую цену (research §6). Тексты — в messages, здесь только порядок. */
export const PRICING_BASICS = [
  'code',
  'lighthouse',
  'responsive',
  'seo',
  'forms',
  'analytics',
  'privacy',
  'hosting',
  'sources',
  'revisions',
  'warranty',
  'training',
  'deadline',
] as const;

/** Четыре темы базы: 13 пунктов читаются группами, а не сплошной колонкой. */
export const PRICING_BASIC_GROUPS: PricingBasicGroup<(typeof PRICING_BASICS)[number]>[] = [
  { id: 'build', items: ['code', 'lighthouse', 'responsive'] },
  { id: 'leads', items: ['forms', 'analytics', 'seo'] },
  { id: 'ownership', items: ['sources', 'hosting', 'privacy', 'training'] },
  { id: 'confidence', items: ['revisions', 'warranty', 'deadline'] },
];
