import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { formatDays, formatMoney, formatRange, planHref, planTerm } from '@/content/format';
import {
  MAX_OPTION,
  PRICING_BASIC_GROUPS,
  PRICING_BASICS,
  PRICING_EXTRAS,
  PRICING_OPTIONS,
  PRICING_PLANS,
  PRICING_TIERS,
} from '@/content/pricing';
import { getServiceBySlug, SERVICES } from '@/content/services';
import { LOCALES } from '@/i18n/consts';

const NBSP = String.fromCodePoint(0x00a0);

const messages = (locale: string) => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'));

const pricingSection = (locale: string, section: string) => messages(locale).pricing?.[section] ?? {};

/** Тарифы по порядку: цена в обеих валютах, «от» и срок в календарных днях (у тарифов «от» срока в днях нет). */
const PLAN_TABLE = [
  { id: 'industry', rub: 70_000, usd: 1_200, isFrom: false, days: 7 },
  { id: 'landing', rub: 50_000, usd: 2_400, isFrom: false, days: 4 },
  { id: 'industryMiniApp', rub: 90_000, usd: 1_800, isFrom: false, days: 7 },
  { id: 'business', rub: 180_000, usd: 4_500, isFrom: false, days: 14 },
  { id: 'miniApp', rub: 180_000, usd: 3_500, isFrom: true, days: undefined },
  { id: 'store', rub: 250_000, usd: 8_000, isFrom: true, days: undefined },
  { id: 'mvp', rub: 300_000, usd: 12_000, isFrom: true, days: undefined },
  { id: 'threeD', rub: 250_000, usd: 4_900, isFrom: true, days: undefined },
  { id: 'logo', rub: 30_000, usd: 600, isFrom: true, days: undefined },
  { id: 'support', rub: 7_000, usd: 140, isFrom: true, days: undefined },
] as const;

/** Отраслевое Mini App своей страницы не имеет: карточка ведет на готовые решения страницы Telegram-приложений. */
const SERVICE_IDS = ['industry', 'landing', 'business', 'miniApp', 'store', 'mvp', 'threeD', 'logo', 'support'];

/** Варианты поддержки по порядку: «Хостинг и бэкапы» без часов правок и три уровня с часами работы в месяц. */
const SUPPORT_TIER_TABLE = [
  { id: 'hostingBackups', planId: 'support', price: { rub: 7_000, usd: 140 }, isFrom: false },
  { id: 'supportHours', planId: 'support', price: { rub: 15_000, usd: 250 }, isFrom: false, hours: 3 },
  { id: 'supportHoursPlus', planId: 'support', price: { rub: 35_000, usd: 700 }, isFrom: false, hours: 10 },
  { id: 'supportHoursPro', planId: 'support', price: { rub: 70_000, usd: 1_400 }, isFrom: false, hours: 25 },
];

/** Группы базы по порядку: правки, гарантия и срок — «Уверенность в результате», инструкция — среди того, что остается у вас. */
const BASIC_GROUPS_TABLE = [
  { id: 'build', items: ['code', 'lighthouse', 'responsive'] },
  { id: 'leads', items: ['forms', 'analytics', 'seo'] },
  { id: 'ownership', items: ['sources', 'hosting', 'privacy', 'training'] },
  { id: 'confidence', items: ['revisions', 'warranty', 'deadline'] },
];

/** Утвержденные заголовки группы правок, гарантии и срока. Неразрывный пробел — escape. */
const CONFIDENCE_HEADINGS: Record<string, string> = {
  ru: 'Уверенность в\u00a0результате',
  en: 'Peace of mind',
};

const RU_DAYS: [number, string][] = [
  [1, `1${NBSP}день`],
  [2, `2${NBSP}дня`],
  [4, `4${NBSP}дня`],
  [5, `5${NBSP}дней`],
  [7, `7${NBSP}дней`],
  [11, `11${NBSP}дней`],
  [14, `14${NBSP}дней`],
  [21, `21${NBSP}день`],
  [22, `22${NBSP}дня`],
];

const EN_DAYS: [number, string][] = [
  [1, '1 day'],
  [4, '4 days'],
  [14, '14 days'],
];

describe('прайс — один источник цен', () => {
  it.each([...LOCALES])('%s: набор тарифов в переводах совпадает с pricing.ts', (locale) => {
    expect(Object.keys(pricingSection(locale, 'plans'))).toEqual(PRICING_PLANS.map((plan) => plan.id));
  });

  it.each([...LOCALES])('%s: у каждого тарифа есть название, состав и срок', (locale) => {
    const plans = pricingSection(locale, 'plans');
    const tiers = pricingSection(locale, 'tiers');
    const tierTexts = { name: expect.any(String), summary: expect.any(String), term: expect.any(String) };

    expect(PRICING_PLANS.map((plan) => [plan.id, plans[plan.id]])).toEqual(
      PRICING_PLANS.map((plan) => [
        plan.id,
        plan.days === undefined
          ? { name: expect.any(String), summary: expect.any(String), term: expect.any(String) }
          : { name: expect.any(String), summary: expect.any(String) },
      ]),
    );
    expect(SUPPORT_TIER_TABLE.map((tier) => [tier.id, tiers[tier.id]])).toEqual(
      SUPPORT_TIER_TABLE.map((tier) => [tier.id, tierTexts]),
    );
  });

  it.each([...LOCALES])('%s: набор опций и позиций прайса совпадает с pricing.ts', (locale) => {
    expect(Object.keys(pricingSection(locale, 'options'))).toEqual(PRICING_OPTIONS.map((option) => option.id));
    expect(Object.keys(pricingSection(locale, 'extras'))).toEqual(PRICING_EXTRAS.map((extra) => extra.id));
    expect(Object.keys(pricingSection(locale, 'basics'))).toEqual([...PRICING_BASICS]);
  });

  it.each([...LOCALES])('%s: у каждой опции есть имя и пояснение', (locale) => {
    const options = pricingSection(locale, 'options');

    expect(PRICING_OPTIONS.map((option) => options[option.id])).toEqual(
      PRICING_OPTIONS.map(() => ({ name: expect.stringMatching(/\S/), note: expect.stringMatching(/\S/) })),
    );
  });

  it('группы базы разбирают все 13 пунктов без потерь и дублей', () => {
    const grouped = PRICING_BASIC_GROUPS.flatMap((group) => group.items);

    expect([...grouped].sort()).toEqual([...PRICING_BASICS].sort());
    expect(new Set(grouped).size).toBe(PRICING_BASICS.length);
  });

  it.each([...LOCALES])('%s: у каждой группы базы есть заголовок', (locale) => {
    expect(Object.keys(pricingSection(locale, 'basicsGroups'))).toEqual(PRICING_BASIC_GROUPS.map((group) => group.id));
  });

  it('группы базы: сборка, заявки, «все остается у вас» с инструкцией и «уверенность в результате»', () => {
    expect(PRICING_BASIC_GROUPS.map(({ id, items }) => ({ id, items }))).toEqual(BASIC_GROUPS_TABLE);
  });

  it.each([...LOCALES])('%s: заголовок группы правок, гарантии и срока — утвержденный, старого ключа нет', (locale) => {
    const headings = pricingSection(locale, 'basicsGroups');

    expect(Object.hasOwn(headings, 'afterLaunch'), 'pricing.basicsGroups.afterLaunch').toBe(false);
    expect(headings.confidence).toBe(CONFIDENCE_HEADINGS[locale]);
  });

  it.each([...PRICING_OPTIONS, MAX_OPTION].map((option) => [option.id, option] as const))(
    '%s: у опции нет ежемесячной платы',
    (id, option) => {
      expect(Object.hasOwn(option, 'monthly'), id).toBe(false);
    },
  );

  it('у тарифов уникальные ключи, у страниц услуг — уникальные адреса; отраслевое Mini App без своей страницы', () => {
    expect(new Set(PRICING_PLANS.map((plan) => plan.id)).size).toBe(PRICING_PLANS.length);
    expect(SERVICES.map((service) => service.id)).toEqual(SERVICE_IDS);
    expect(new Set(SERVICES.map((service) => service.slug)).size).toBe(SERVICES.length);
    expect(getServiceBySlug('mini-app')?.id).toBe('miniApp');
  });

  it('тарифы по порядку: отраслевой сайт, лендинг, отраслевое Mini App, «Бизнес» и дальше', () => {
    expect(PRICING_PLANS.map((plan) => plan.id)).toEqual(PLAN_TABLE.map((row) => row.id));
  });

  it.each(PLAN_TABLE.map((row) => [row.id, row] as const))('%s: цена, «от» и срок в днях', (id, row) => {
    const plan = PRICING_PLANS.find((item) => item.id === id);

    expect(plan, `тариф ${id}`).toBeDefined();
    expect(plan?.price).toEqual({ rub: row.rub, usd: row.usd });
    expect(plan?.isFrom).toBe(row.isFrom);
    expect(plan?.days).toBe(row.days);
  });

  it('у поддержки по порядку «Хостинг и бэкапы» и три уровня с часами', () => {
    expect(PRICING_TIERS.filter((tier) => tier.planId === 'support').map((tier) => tier.id)).toEqual(
      SUPPORT_TIER_TABLE.map((tier) => tier.id),
    );
  });

  it.each(SUPPORT_TIER_TABLE.map((row) => [row.id, row] as const))(
    'вариант поддержки %s: цена без «от» и часы работы в месяц',
    (id, row) => {
      expect(PRICING_TIERS.find((tier) => tier.id === id)).toEqual(row);
    },
  );

  it('варианты 3D прежние', () => {
    expect(PRICING_TIERS.find((tier) => tier.id === 'block3d')).toEqual({
      id: 'block3d',
      planId: 'threeD',
      price: { rub: 250_000, usd: 4_900 },
      isFrom: true,
    });
    expect(PRICING_TIERS.find((tier) => tier.id === 'landing3d')).toEqual({
      id: 'landing3d',
      planId: 'threeD',
      price: { rub: 350_000, usd: 7_300 },
      isFrom: true,
    });
  });

  it('MAX — опция отраслевого Mini App за 15 000 ₽, не среди опций к любому тарифу', () => {
    expect(MAX_OPTION).toEqual({ id: 'max', price: { from: { rub: 15_000, usd: 300 } } });
    expect(PRICING_OPTIONS.map((option) => option.id)).not.toContain('max');
  });

  it('час работы — 3 000 ₽ / $90', () => {
    expect(PRICING_EXTRAS.find((extra) => extra.id === 'hour')).toEqual({
      id: 'hour',
      price: { rub: 3_000, usd: 90 },
      period: 'hour',
    });
  });
});

describe('formatDays', () => {
  it.each(RU_DAYS)('ru: %i → %j', (days, expected) => {
    expect(formatDays(days, 'ru')).toBe(expected);
  });

  it.each(EN_DAYS)('en: %i → %j', (days, expected) => {
    expect(formatDays(days, 'en')).toBe(expected);
  });
});

describe('planTerm', () => {
  it.each([...LOCALES])('%s: у тарифа с днями срок — из дней, перевод не читается', (locale) => {
    const landing = PRICING_PLANS.find((plan) => plan.id === 'landing');
    const translated = vi.fn(() => 'срок из перевода');

    expect(landing ? planTerm(landing, locale, translated) : undefined).toBe(formatDays(4, locale));
    expect(translated).not.toHaveBeenCalled();
  });

  it.each([...LOCALES])('%s: у тарифа без дней срок — строка перевода, прочитанная один раз', (locale) => {
    const store = PRICING_PLANS.find((plan) => plan.id === 'store');
    const translated = vi.fn(() => 'срок из перевода');

    expect(store ? planTerm(store, locale, translated) : undefined).toBe('срок из перевода');
    expect(translated).toHaveBeenCalledTimes(1);
  });
});

describe('formatMoney', () => {
  it('в рублях разделяет разряды неразрывным пробелом', () => {
    expect(formatMoney({ rub: 100_000, usd: 2_400 }, 'ru')).toBe(`100${NBSP}000${NBSP}₽`);
    expect(formatMoney({ rub: 5_000, usd: 90 }, 'ru')).toBe(`5${NBSP}000${NBSP}₽`);
    expect(formatMoney({ rub: 600_000, usd: 12_000 }, 'ru')).toBe(`600${NBSP}000${NBSP}₽`);
  });

  it('в долларах ставит знак перед суммой и запятую в разрядах', () => {
    expect(formatMoney({ rub: 100_000, usd: 2_400 }, 'en')).toBe('$2,400');
    expect(formatMoney({ rub: 15_000, usd: 250 }, 'en')).toBe('$250');
    expect(formatMoney({ rub: 600_000, usd: 12_000 }, 'en')).toBe('$12,000');
  });
});

describe('formatRange', () => {
  it('в вилке валюта стоит один раз, границы разделены тире', () => {
    const range = { from: { rub: 15_000, usd: 300 }, to: { rub: 40_000, usd: 800 } };

    expect(formatRange(range, 'ru')).toBe(`15${NBSP}000–40${NBSP}000${NBSP}₽`);
    expect(formatRange(range, 'en')).toBe('$300–800');
  });

  it('вилка из одной суммы печатается как обычная цена', () => {
    const range = { from: { rub: 20_000, usd: 400 } };

    expect(formatRange(range, 'ru')).toBe(`20${NBSP}000${NBSP}₽`);
    expect(formatRange(range, 'en')).toBe('$400');
  });
});

describe('planHref', () => {
  it('ведет на страницу услуги в текущем языке и передает выбранный тариф; отраслевое Mini App — на готовые решения', () => {
    expect(PRICING_PLANS.map((plan) => planHref('ru', plan))).toEqual([
      '/ru/industry?plan=industry',
      '/ru/landing?plan=landing',
      '/ru/mini-app#ready',
      '/ru/business?plan=business',
      '/ru/mini-app?plan=miniApp',
      '/ru/store?plan=store',
      '/ru/mvp?plan=mvp',
      '/ru/3d?plan=threeD',
      '/ru/logo?plan=logo',
      '/ru/support?plan=support',
    ]);
    expect(planHref('en', PRICING_PLANS[0])).toBe('/en/industry?plan=industry');

    const industryMiniApp = PRICING_PLANS.find((plan) => plan.id === 'industryMiniApp');

    expect(industryMiniApp ? planHref('en', industryMiniApp) : undefined).toBe('/en/mini-app#ready');
  });
});
