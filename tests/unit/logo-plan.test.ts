import { describe, expect, it } from 'vitest';
import { initialBriefAnswers } from '@/components/Brief/initial-answers';
import { formatMoney } from '@/content/format';
import { PRICING_PLANS, PRICING_TIERS } from '@/content/pricing';
import { getServiceBySlug, SERVICES, serviceBriefHref, tierBriefHref } from '@/content/services';
import { LOCALES } from '@/i18n/consts';
import { BRIEF_PLAN_VALUES, BRIEF_STEP_VALUES, HONEYPOT_FIELD } from '@/lib/brief/consts';
import { parseLead } from '@/lib/brief/lead';
import { parseBriefPreset } from '@/lib/brief/preset';
import { SITE_PAGES } from '@/lib/seo/consts';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type Locale = (typeof LOCALES)[number];

type TierTexts = { name: string; summary: string; term: string };

type Messages = { pricing: { tiers: Record<string, TierTexts | undefined> } };

const MESSAGES = { ru, en } as unknown as Record<Locale, Messages>;

/** Услуга «Логотип и фирменный стиль»: цена «от» нижнего уровня, срок — строкой перевода, без дней. */
const LOGO_PLAN = { id: 'logo', slug: 'logo', price: { rub: 30_000, usd: 600 }, isFrom: true };

/** Три уровня по порядку: цены фиксированные, доллары — рубли / 50. */
const LOGO_TIERS = [
  { id: 'logoMark', planId: 'logo', price: { rub: 30_000, usd: 600 }, isFrom: false },
  { id: 'logoIdentity', planId: 'logo', price: { rub: 85_000, usd: 1_700 }, isFrom: false },
  { id: 'logoBrandbook', planId: 'logo', price: { rub: 150_000, usd: 3_000 }, isFrom: false },
];

const TIER_IDS = LOGO_TIERS.map((tier) => tier.id);

const filled = expect.stringMatching(/\S/);

const CONTEXT = { marks: {}, page: '/ru/brief' };

const INPUT = {
  niche: 'horeca',
  design: 'kinetic',
  timing: 'month',
  budget: 'upTo100',
  name: 'Иван',
  contact: '@ivan',
  comment: '',
  consent: true,
  [HONEYPOT_FIELD]: '',
};

describe('услуга «Логотип и фирменный стиль» в прайсе', () => {
  it('в прайсе ровно один тариф logo: адрес logo, от 30 000 ₽ / $600, без срока в днях и без якоря', () => {
    const plans = PRICING_PLANS.filter((plan) => plan.id === 'logo');

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject(LOGO_PLAN);
    expect(plans[0]?.days).toBeUndefined();
    expect(plans[0]?.anchor).toBeUndefined();
  });

  it('подпись цены тарифа logo тем же кодом, что таблица, — «от 30 000 ₽»', () => {
    const plan = PRICING_PLANS.find((item) => item.id === 'logo');
    const label = plan ? ru.pricing.price.from.replace('{amount}', formatMoney(plan.price, 'ru')) : undefined;

    expect(label).toBe('от 30 000 ₽');
  });

  it('у тарифа logo три уровня по порядку: 30 000 / 85 000 / 150 000 ₽, цены фиксированные, без часов', () => {
    const tiers = PRICING_TIERS.filter((tier) => tier.planId === 'logo');

    expect(tiers).toMatchObject(LOGO_TIERS);
    expect(tiers.map((tier) => tier.hours)).toEqual([undefined, undefined, undefined]);
  });

  const TEXT_ROWS = LOCALES.flatMap((locale) => TIER_IDS.map((id) => [locale, id] as const));

  it.each(TEXT_ROWS)('%s: у уровня %s ровно название, состав и срок, все непустые', (locale, id) => {
    expect(MESSAGES[locale].pricing.tiers[id]).toEqual({ name: filled, summary: filled, term: filled });
  });

  it('logo — предпоследний тариф, support — последний', () => {
    expect(PRICING_PLANS.slice(-2).map((plan) => plan.id)).toEqual(['logo', 'support']);
  });

  it('getServiceBySlug(logo) — страница услуги logo, адрес /logo есть в списке страниц сайта', () => {
    expect(getServiceBySlug('logo')).toMatchObject({ id: 'logo', slug: 'logo' });
    expect(SITE_PAGES).toContain('/logo');
  });
});

describe('квиз принимает услугу «Логотип и фирменный стиль» и ее уровни', () => {
  it('на первом шаге logo стоит прямо перед support, все три уровня проходят в ?plan=', () => {
    const products = BRIEF_STEP_VALUES.product;
    const support = products.indexOf('support');

    expect(products.slice(support - 1, support + 1)).toEqual(['logo', 'support']);
    expect(BRIEF_PLAN_VALUES).toEqual(expect.arrayContaining(TIER_IDS));
  });

  it('с ?plan=logoIdentity выбраны продукт logo и уровень logoIdentity, с ?plan=logo — продукт logo', () => {
    const preset = parseBriefPreset({ plan: 'logoIdentity' });

    expect(preset).toEqual({ plan: 'logoIdentity', niche: null });
    expect(initialBriefAnswers({ design: 'kinetic', plan: preset.plan, niche: null }).product).toBe('logo');
    expect(parseBriefPreset({ plan: 'logo' })).toEqual({ plan: 'logo', niche: null });
    expect(initialBriefAnswers({ design: 'kinetic', plan: 'logo', niche: null }).product).toBe('logo');
  });

  it('заявка с product=logo и plan=logoBrandbook принята, продукт и уровень сохранены как есть', () => {
    expect(parseLead({ ...INPUT, product: 'logo', plan: 'logoBrandbook' }, CONTEXT)).toMatchObject({
      ok: true,
      lead: { product: 'logo', plan: 'logoBrandbook' },
    });
  });

  it('кнопки страницы ведут в квиз: услуга — /ru/brief?plan=logo, уровень — /en/brief?plan=logoMark', () => {
    const service = SERVICES.find((item) => item.id === 'logo');
    const tier = PRICING_TIERS.find((item) => item.id === 'logoMark');

    expect(service ? serviceBriefHref('ru', service) : undefined).toBe('/ru/brief?plan=logo');
    expect(tier ? tierBriefHref('en', tier) : undefined).toBe('/en/brief?plan=logoMark');
  });
});
