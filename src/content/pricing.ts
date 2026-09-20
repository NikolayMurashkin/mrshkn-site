import type { PricingBasicGroup, PricingExtra, PricingOption, PricingPlan } from './types';

/**
 * Единственный источник цен на сайте. Рубли — решение D5 в `../PLAN.md`, доллары — таблица
 * «Линейка» из бизнес-плана (`docs/studio-plan.html`), кроме лендинга: у него D5 новее ($2 400).
 * Цены опций в долларах пересчитаны из рублевых по курсу 50 ₽ — тому же, по которому в бизнес-плане
 * посчитаны «Бизнес», магазин и MVP.
 */
export const PRICING_PLANS: PricingPlan[] = [
  { id: 'landing', slug: 'landing', price: { rub: 100_000, usd: 2_400 }, isFrom: false },
  { id: 'business', slug: 'business', price: { rub: 220_000, usd: 4_500 }, isFrom: false },
  { id: 'miniApp', slug: 'mini-app', price: { rub: 180_000, usd: 3_500 }, isFrom: true },
  { id: 'store', slug: 'store', price: { rub: 400_000, usd: 8_000 }, isFrom: true },
  { id: 'mvp', slug: 'mvp', price: { rub: 600_000, usd: 12_000 }, isFrom: true },
  { id: 'support', slug: 'support', price: { rub: 15_000, usd: 250 }, isFrom: true },
];

export const PRICING_OPTIONS: PricingOption[] = [
  { id: 'booking', price: { from: { rub: 15_000, usd: 300 }, to: { rub: 40_000, usd: 800 } } },
  { id: 'payments', price: { from: { rub: 15_000, usd: 300 }, to: { rub: 25_000, usd: 500 } } },
  { id: 'quiz', price: { from: { rub: 20_000, usd: 400 } } },
  { id: 'calculator', price: { from: { rub: 25_000, usd: 500 }, to: { rub: 40_000, usd: 800 } } },
  { id: 'reviews', price: { from: { rub: 10_000, usd: 200 }, to: { rub: 15_000, usd: 300 } } },
  { id: 'messengers', price: { from: { rub: 8_000, usd: 160 }, to: { rub: 15_000, usd: 300 } } },
  {
    id: 'assistant',
    price: { from: { rub: 40_000, usd: 800 }, to: { rub: 60_000, usd: 1_200 } },
    monthly: { from: { rub: 3_000, usd: 60 }, to: { rub: 5_000, usd: 100 } },
  },
  { id: 'language', price: { from: { rub: 20_000, usd: 400 } } },
  { id: 'blog', price: { from: { rub: 25_000, usd: 500 } } },
  { id: 'crm', price: { from: { rub: 15_000, usd: 300 }, to: { rub: 30_000, usd: 600 } } },
  { id: 'branches', price: { from: { rub: 15_000, usd: 300 } } },
  { id: 'catalog', price: { from: { rub: 20_000, usd: 400 }, to: { rub: 35_000, usd: 700 } } },
  {
    id: 'geo',
    price: { from: { rub: 30_000, usd: 600 } },
    monthly: { from: { rub: 15_000, usd: 300 } },
  },
];

export const PRICING_EXTRAS: PricingExtra[] = [
  { id: 'subscription', price: { rub: 180_000, usd: 3_500 }, period: 'month' },
  { id: 'hour', price: { rub: 5_000, usd: 90 }, period: 'hour' },
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
  { id: 'ownership', items: ['sources', 'hosting', 'privacy'] },
  { id: 'afterLaunch', items: ['revisions', 'warranty', 'training', 'deadline'] },
];
