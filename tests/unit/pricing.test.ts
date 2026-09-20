import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatMoney, formatRange, planHref } from '@/content/format';
import { PRICING_BASICS, PRICING_EXTRAS, PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { LOCALES } from '@/i18n/consts';

const NBSP = String.fromCodePoint(0x00a0);

const messages = (locale: string) => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'));

const pricingSection = (locale: string, section: string) => messages(locale).pricing?.[section] ?? {};

describe('прайс — один источник цен', () => {
  it.each([...LOCALES])('%s: набор тарифов в переводах совпадает с pricing.ts', (locale) => {
    expect(Object.keys(pricingSection(locale, 'plans'))).toEqual(PRICING_PLANS.map((plan) => plan.id));
  });

  it.each([...LOCALES])('%s: у каждого тарифа есть название, состав и срок', (locale) => {
    const plans = pricingSection(locale, 'plans');

    expect(PRICING_PLANS.map((plan) => plans[plan.id])).toEqual(
      PRICING_PLANS.map(() => ({ name: expect.any(String), summary: expect.any(String), term: expect.any(String) })),
    );
  });

  it.each([...LOCALES])('%s: набор опций и позиций прайса совпадает с pricing.ts', (locale) => {
    expect(Object.keys(pricingSection(locale, 'options'))).toEqual(PRICING_OPTIONS.map((option) => option.id));
    expect(Object.keys(pricingSection(locale, 'extras'))).toEqual(PRICING_EXTRAS.map((extra) => extra.id));
    expect(Object.keys(pricingSection(locale, 'basics'))).toEqual([...PRICING_BASICS]);
  });

  it('у тарифов уникальные ключи и адреса страниц услуг', () => {
    expect(new Set(PRICING_PLANS.map((plan) => plan.id)).size).toBe(PRICING_PLANS.length);
    expect(new Set(PRICING_PLANS.map((plan) => plan.slug)).size).toBe(PRICING_PLANS.length);
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
  it('ведет на страницу услуги в текущем языке и передает выбранный тариф', () => {
    expect(PRICING_PLANS.map((plan) => planHref('ru', plan))).toEqual([
      '/ru/landing?plan=landing',
      '/ru/business?plan=business',
      '/ru/mini-app?plan=miniApp',
      '/ru/store?plan=store',
      '/ru/mvp?plan=mvp',
      '/ru/support?plan=support',
    ]);
    expect(planHref('en', PRICING_PLANS[0])).toBe('/en/landing?plan=landing');
  });
});
