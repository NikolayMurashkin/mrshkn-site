import { createRequire } from 'node:module';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { formatMoney, planHref } from '@/content/format';
import { PRICING_PLANS, PRICING_TIERS } from '@/content/pricing';
import { DESIGN_NAMES } from '@/designs/consts';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { DesignName, SectionProps } from '@/designs/types';
import { LOCALES } from '@/i18n/consts';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

const require = createRequire(import.meta.url);

type Locale = (typeof LOCALES)[number];

type Texts = { name: string; summary: string; term: string };

type Messages = {
  pricing: {
    price: { from: string };
    plans: Record<string, Texts | undefined>;
    tiers?: Record<string, Texts | undefined>;
  };
};

type ProviderProps = { locale: string; messages: unknown; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

const MESSAGES = { ru, en } as unknown as Record<Locale, Messages>;

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

const THREE_D_PLAN = { id: 'threeD', slug: '3d', price: { rub: 250_000, usd: 4_900 }, isFrom: true };

const THREE_D_TIERS = [
  { id: 'block3d', planId: 'threeD', price: { rub: 250_000, usd: 4_900 }, isFrom: true },
  { id: 'landing3d', planId: 'threeD', price: { rub: 350_000, usd: 7_300 }, isFrom: true },
];

const TIER_IDS = THREE_D_TIERS.map((tier) => tier.id);

const TIER_TERMS: Record<Locale, Record<string, string>> = {
  ru: { block3d: '4 недели', landing3d: '6 недель' },
  en: { block3d: '4 weeks', landing3d: '6 weeks' },
};

const TIER_NAMES_RU: Record<string, string> = { block3d: '3D-блок', landing3d: '3D-лендинг' };

const PLAN_TERM_UNIT: Record<Locale, string> = { ru: 'недель', en: 'weeks' };

const VOID_TAGS = new Set([
  'area',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const NBSP = String.fromCodePoint(0x00a0);

const filled = expect.stringMatching(/\S/);

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const spaced = (text: string | undefined) => text?.replaceAll(NBSP, ' ');

const renderService = (design: DesignName, locale: Locale, service: string) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, messages: MESSAGES[locale] },
      SECTIONS[design]({ section: 'servicePage', service } as unknown as SectionProps),
    ),
  );

/** Сущности HTML раскрываются, неразрывные пробелы остаются: цена сравнивается ровно со строкой кода цен. */
const decode = (text: string) =>
  text
    .replace(/&nbsp;/g, NBSP)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

const textOf = (html: string) => decode(html.replace(/<[^>]*>/g, ''));

const hrefOf = (openTag: string) => {
  const match = /\shref="([^"]*)"/.exec(openTag);

  return match ? decode(match[1]) : null;
};

const elementsOf = (html: string): Element[] => {
  const elements: Element[] = [];
  const stack: { tag: string; start: number }[] = [];

  for (const match of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g)) {
    const [whole, closing, name, selfClosing] = match;
    const tag = name.toLowerCase();
    const index = match.index;

    if (closing) {
      const openIndex = stack.map((item) => item.tag).lastIndexOf(tag);

      if (openIndex !== -1) {
        const [open] = stack.splice(openIndex);
        elements.push({ tag, start: open.start, end: index + whole.length });
      }
    } else if (selfClosing || VOID_TAGS.has(tag)) {
      elements.push({ tag, start: index, end: index + whole.length });
    } else {
      stack.push({ tag, start: index });
    }
  }

  return elements.sort((a, b) => a.start - b.start);
};

const linksOf = (html: string) =>
  elementsOf(html)
    .filter((element) => element.tag === 'a')
    .map((element) => {
      const markup = html.slice(element.start, element.end);

      return { ...element, href: hrefOf(markup.slice(0, markup.indexOf('>') + 1)) };
    });

const tierHref = (locale: Locale, tierId: string) => `/${locale}/brief?plan=${tierId}`;

/**
 * Текст карточки варианта: самый внешний предок ссылки варианта, в котором нет ссылки другого варианта.
 * null — ссылки варианта на странице нет.
 */
const tierCardText = (html: string, locale: Locale, tierId: string) => {
  const links = linksOf(html);
  const own = links.find((link) => link.href === tierHref(locale, tierId));

  if (!own) {
    return null;
  }

  const others = links.filter((link) => TIER_IDS.some((id) => id !== tierId && link.href === tierHref(locale, id)));
  const card = elementsOf(html)
    .filter((element) => element.start <= own.start && element.end >= own.end)
    .filter((element) => !others.some((link) => link.start >= element.start && link.end <= element.end))
    .sort((a, b) => b.end - b.start - (a.end - a.start))[0];

  return textOf(html.slice(card.start, card.end));
};

const tierPriceText = (locale: Locale, tier: (typeof THREE_D_TIERS)[number]) =>
  MESSAGES[locale].pricing.price.from.replace('{amount}', formatMoney(tier.price, locale));

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

describe('услуга «3D-интерактив» в прайсе', () => {
  it('в прайсе ровно один тариф threeD: адрес 3d, от 250 000 ₽ / $4 900; последним по-прежнему идет поддержка', () => {
    expect(PRICING_PLANS.filter((plan) => plan.id === 'threeD')).toEqual([THREE_D_PLAN]);
    expect(PRICING_PLANS.at(-1)?.id).toBe('support');
  });

  it('у тарифа threeD два варианта: 3D-блок от 250 000 ₽ / $4 900 и 3D-лендинг от 350 000 ₽ / $7 300, тариф каждого есть в прайсе', () => {
    const tiers = PRICING_TIERS ?? [];

    expect(tiers.filter((tier) => tier.planId === 'threeD')).toEqual(THREE_D_TIERS);

    for (const tier of tiers) {
      expect(
        PRICING_PLANS.map((plan) => plan.id),
        `тариф варианта ${tier.id}`,
      ).toContain(tier.planId);
    }
  });

  it.each([...LOCALES])(
    '%s: у каждого варианта есть название, состав и срок 4 и 6 недель, у тарифа — название и оба срока',
    (locale) => {
      const tiers = MESSAGES[locale].pricing.tiers ?? {};
      const plan = MESSAGES[locale].pricing.plans.threeD;

      expect(Object.keys(tiers).sort()).toEqual(PRICING_TIERS.map((tier) => tier.id).sort());

      for (const id of TIER_IDS) {
        expect(tiers[id], `тексты варианта ${id}`).toEqual({ name: filled, summary: filled, term: filled });
        expect(spaced(tiers[id]?.term), `срок варианта ${id}`).toBe(TIER_TERMS[locale][id]);

        if (locale === 'ru') {
          expect(spaced(tiers[id]?.name), `название варианта ${id}`).toBe(TIER_NAMES_RU[id]);
        } else {
          expect(tiers[id]?.name, `название варианта ${id}`).toContain('3D');
        }
      }

      if (locale === 'ru') {
        expect(spaced(plan?.name)).toBe('3D-интерактив');
      }

      expect(plan, 'тексты тарифа threeD').toEqual({ name: filled, summary: filled, term: filled });
      expect(plan?.term).toContain('4');
      expect(plan?.term).toContain('6');
      expect(plan?.term).toContain(PLAN_TERM_UNIT[locale]);
    },
  );

  const PAGE_ROWS = DESIGN_NAMES.flatMap((design) =>
    LOCALES.flatMap((locale) => THREE_D_TIERS.map((tier) => [design, locale, tier.id, tier] as const)),
  );

  it.each(PAGE_ROWS)(
    '%s, %s, %s: на странице услуги цена варианта собрана общим кодом цен, рядом его срок',
    (design, locale, tierId, tier) => {
      const html = renderService(design, locale, 'threeD');
      const card = tierCardText(html, locale, tierId);
      const term = MESSAGES[locale].pricing.tiers?.[tierId]?.term;

      expect(html).toContain('data-service="threeD"');
      expect(card, `карточка варианта со ссылкой ${tierHref(locale, tierId)}`).not.toBeNull();
      expect(card).toContain(tierPriceText(locale, tier));
      expect(term, `срок варианта ${tierId}`).toEqual(filled);
      expect(card).toContain(term);
    },
  );

  it('адрес тарифа threeD — страница /3d с выбранным тарифом', () => {
    const plan = PRICING_PLANS.find((item) => item.id === 'threeD');

    expect(plan ? planHref('ru', plan) : undefined).toBe('/ru/3d?plan=threeD');
  });

  it('Lighthouse CI замеряет страницу «3D-интерактив»', () => {
    expect(loadLighthouseConfig().ci.collect.url).toContain('http://localhost:3102/ru/3d');
  });
});
