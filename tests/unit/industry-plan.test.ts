import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { formatDays } from '@/content/format';
import { INDUSTRY_NICHES, industryNicheHref } from '@/content/industry';
import { PRICING_PLANS } from '@/content/pricing';
import { SERVICES } from '@/content/services';
import { LOCALES } from '@/i18n/consts';
import { BRIEF_STEP_VALUES } from '@/lib/brief/consts';
import { parseBriefPreset } from '@/lib/brief/preset';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

const require = createRequire(import.meta.url);

type Locale = (typeof LOCALES)[number];

type PlanTexts = { name: string; summary: string; term?: string };

type IndustryTexts = {
  included: { note: string; items: string[] };
  excluded: { note: string; items: string[] };
  niches: Record<string, { title: string; text: string }>;
  process: unknown[];
  faq: unknown[];
};

type Messages = {
  pricing: { plans: Record<string, PlanTexts | undefined> };
  services: Record<string, IndustryTexts | undefined>;
};

const MESSAGES = { ru, en } as unknown as Record<Locale, Messages>;

const NICHES = ['clinic', 'expert', 'horeca'] as const;

const INDUSTRY_PLAN = { id: 'industry', slug: 'industry', price: { rub: 70_000, usd: 1_200 }, isFrom: false, days: 7 };

const NBSP = String.fromCodePoint(0x00a0);

const spaced = (text: string | undefined) => text?.replaceAll(NBSP, ' ');

const filled = expect.stringMatching(/\S/);

const industryTexts = (locale: Locale) => MESSAGES[locale].services.industry;

const INCLUDED_PARTS: Record<Locale, string[]> = {
  ru: ['дизайн', 'стил', 'текст', 'фото', 'домен', 'заявк', 'админк'],
  en: ['design', 'style', 'text', 'photo', 'domain', 'request', 'admin'],
};

const TERM_DAYS: Record<Locale, string> = { ru: '7 дней', en: '7 days' };

const loadLighthouseConfig = (): { ci: { collect: { url: string[] } } } => {
  const previous = process.env.LIGHTHOUSE_DESIGN;
  const path = '../../lighthouserc.cjs';

  delete process.env.LIGHTHOUSE_DESIGN;
  delete require.cache[require.resolve(path)];

  try {
    return require(path);
  } finally {
    if (previous !== undefined) {
      process.env.LIGHTHOUSE_DESIGN = previous;
    }

    delete require.cache[require.resolve(path)];
  }
};

describe('тариф «Отраслевой сайт за 7 дней» в прайсе', () => {
  it('в прайсе ровно один тариф industry: свой адрес, 70 000 ₽ / $1 200, цена точная, 7 дней', () => {
    expect(PRICING_PLANS.filter((plan) => plan.id === 'industry')).toEqual([INDUSTRY_PLAN]);
  });

  it('адрес industry есть среди адресов страниц услуг, адреса start нет, адреса не повторяются', () => {
    const slugs = SERVICES.map((service) => service.slug);

    expect(slugs).toContain('industry');
    expect(slugs).not.toContain('start');
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('«Старт» по-прежнему лендинг, теперь за 50 000 ₽, отраслевой тариф называется иначе', () => {
    const plans = MESSAGES.ru.pricing.plans;
    const landing = PRICING_PLANS.find((plan) => plan.id === 'landing');

    expect(plans.industry?.name).toBe('Сайт для вашей сферы');
    expect(plans.industry?.name).not.toContain('Старт');
    expect(plans.landing?.name).toContain('Старт');
    expect(landing?.price.rub).toBe(50_000);
    expect(landing?.isFrom).toBe(false);
  });

  it.each([...LOCALES])('%s: у тарифа industry есть название, состав и срок 7 дней', (locale) => {
    const texts = MESSAGES[locale].pricing.plans.industry;
    const plan = PRICING_PLANS.find((item) => item.id === 'industry');

    expect(texts).toEqual({ name: filled, summary: filled });
    expect(plan?.days).toBe(7);
    expect(spaced(formatDays(plan?.days ?? 0, locale))).toBe(TERM_DAYS[locale]);
  });
});

describe('тексты страницы отраслевого тарифа', () => {
  it('в ru и en одинаковый состав разделов и пунктов, три ниши, все тексты заполнены', () => {
    const textsRu = industryTexts('ru');
    const textsEn = industryTexts('en');

    for (const texts of [textsRu, textsEn]) {
      expect(Object.keys(texts ?? {})).toEqual(
        expect.arrayContaining(['included', 'excluded', 'niches', 'process', 'faq']),
      );
    }

    expect(Object.keys(textsRu!).sort()).toEqual(Object.keys(textsEn!).sort());
    expect(textsRu!.included.items.length).toBe(textsEn!.included.items.length);
    expect(textsRu!.excluded.items.length).toBe(textsEn!.excluded.items.length);
    expect(textsRu!.process.length).toBe(textsEn!.process.length);
    expect(textsRu!.faq.length).toBe(textsEn!.faq.length);

    for (const texts of [textsRu!, textsEn!]) {
      expect(Object.keys(texts.niches)).toEqual([...NICHES]);

      for (const niche of NICHES) {
        expect(texts.niches[niche], niche).toEqual({ title: filled, text: filled });
      }

      for (const item of [...texts.included.items, ...texts.excluded.items]) {
        expect(item).toEqual(filled);
      }

      expect(texts.included.items.length).toBe(6);
      expect(texts.excluded.items.length).toBeGreaterThanOrEqual(1);
      expect(texts.faq.length).toBeGreaterThanOrEqual(1);
    }
  });

  it.each([...LOCALES])('%s: в «что входит» есть дизайн под вас, тексты, фото, домен, заявка и админка', (locale) => {
    const included = (industryTexts(locale)?.included.items ?? []).join(' ').toLowerCase();

    for (const part of INCLUDED_PARTS[locale]) {
      expect(included, part).toContain(part);
    }
  });
});

describe('карточки отраслей ведут в квиз с предвыбором ниши', () => {
  it('ниши — клиника, эксперт, кофейня, все из справочника квиза; тариф industry есть в квизе', () => {
    expect([...INDUSTRY_NICHES]).toEqual([...NICHES]);

    for (const niche of INDUSTRY_NICHES) {
      expect(BRIEF_STEP_VALUES.niche).toContain(niche);
    }

    expect(BRIEF_STEP_VALUES.product).toContain('industry');
  });

  const HREF_ROWS = LOCALES.flatMap((locale) => NICHES.map((niche) => [locale, niche] as const));

  it.each(HREF_ROWS)(
    '%s, %s: адрес карточки — квиз с тарифом industry и нишей, квиз его разбирает',
    (locale, niche) => {
      const href = industryNicheHref(locale, niche);
      const { searchParams } = new URL(href, 'http://x');

      expect(href).toBe(`/${locale}/brief?plan=industry&niche=${niche}`);
      expect(searchParams.get('niche')).toBe(niche);
      expect(
        parseBriefPreset({
          plan: searchParams.get('plan') ?? undefined,
          niche: searchParams.get('niche') ?? undefined,
        }),
      ).toEqual({ plan: 'industry', niche });
    },
  );
});

describe('Lighthouse CI', () => {
  it('замеряет страницу тарифа industry', () => {
    expect(loadLighthouseConfig().ci.collect.url).toContain('http://localhost:3102/ru/industry');
  });
});
