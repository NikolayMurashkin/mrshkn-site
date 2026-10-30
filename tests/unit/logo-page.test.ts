import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { serviceFaqJsonLd } from '@/content/services';
import type { ServiceMessages } from '@/content/types';
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

type Locale = (typeof LOCALES)[number];

type TierTexts = { name: string; summary: string; term: string };

type Step = { when: string; title: string; text: string };

type Faq = { question: string; answer: string };

type LogoTexts = {
  lead: string;
  tierPoints: Record<string, string[] | undefined>;
  basics: { note: string; items: string[] };
  process: Step[];
  faq: Faq[];
};

type ProcessCardTexts = Record<string, { title: string; text: string }>;

type Messages = {
  pricing: {
    price: { from: string };
    plans: Record<string, { name: string; summary: string; term?: string } | undefined>;
    tiers: Record<string, TierTexts | undefined>;
    basics: Record<string, string>;
    basicsGroups: Record<string, string>;
  };
  services: Record<string, LogoTexts | undefined>;
  servicePage: {
    allOptions: string;
    revisions: string;
    cardPoints: { deadline: string; warranty: string };
    priceKind: { exact: string; from: string; month: string };
    logo?: { tiersHeading: string; priceKind: string };
  };
  process: {
    prestartHeading: string;
    afterHeading: string;
    prestart: ProcessCardTexts;
    after: ProcessCardTexts;
  };
};

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

type Link = Element & { href: string | null };

const MESSAGES = { ru, en } as unknown as Record<Locale, Messages>;

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

/** Три уровня по порядку карточек на странице. */
const TIERS = ['logoMark', 'logoIdentity', 'logoBrandbook'] as const;

/** Сумма карточки уровня, как ее печатает сайт: точная, без «от». */
const TIER_PRICES: Record<Locale, Record<(typeof TIERS)[number], string>> = {
  ru: {
    logoMark: '30 000 ₽',
    logoIdentity: '85 000 ₽',
    logoBrandbook: '150 000 ₽',
  },
  en: {
    logoMark: '$600',
    logoIdentity: '$1,700',
    logoBrandbook: '$3,000',
  },
};

/** Цена услуги в шапке и карточке справа — «от» нижнего уровня. */
const PLAN_PRICES: Record<Locale, string> = { ru: '30 000 ₽', en: '$600' };

/** Цена «от» в языке страницы: такой подписи у карточек уровней быть не должно. */
const FROM_PREFIX: Record<Locale, string> = { ru: 'от ', en: 'from ' };

/** Направления, у которых в карточке варианта есть список пунктов. */
const POINTS_DESIGNS = ['kinetic', 'terminal'] as const satisfies readonly DesignName[];

const FAQ_COUNT = 8;

const STEP_COUNT = 4;

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

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const renderLogo = (design: DesignName, locale: Locale) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] },
      SECTIONS[design]({ section: 'servicePage', service: 'logo' } as unknown as SectionProps),
    ),
  );

const decode = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replaceAll(NBSP, ' ');

/** Видимый текст: без тегов, неразрывный пробел — обычный (сравнение с переводом через `spaced`). */
const textOf = (html: string) => decode(html.replace(/<[^>]*>/g, ''));

const spaced = (text: string | undefined) => (text ?? '\u0000').replaceAll(NBSP, ' ');

const attrOf = (openTag: string, name: string) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(openTag);

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

const openTagOf = (html: string, element: Element) => html.slice(element.start, html.indexOf('>', element.start) + 1);

const linksOf = (html: string): Link[] =>
  elementsOf(html)
    .filter((element) => element.tag === 'a')
    .map((element) => ({ ...element, href: attrOf(openTagOf(html, element), 'href') }));

const byTestId = (html: string, testId: string) =>
  elementsOf(html).find((element) => openTagOf(html, element).includes(` data-testid="${testId}"`)) ?? null;

const childrenOf = (html: string, parent: Element) => {
  const inside = elementsOf(html).filter((element) => element.start > parent.start && element.end < parent.end);

  return inside.filter(
    (element) => !inside.some((other) => other !== element && other.start < element.start && other.end > element.end),
  );
};

const testIdText = (html: string, testId: string) => {
  const element = byTestId(html, testId);

  return element ? textOf(html.slice(element.start, element.end)) : null;
};

/** Позиции строк в тексте по порядку; -1 — строки нет после предыдущей. */
const positionsInOrder = (text: string, parts: string[]) => {
  let from = 0;

  return parts.map((part) => {
    const index = text.indexOf(part, from);

    from = index === -1 ? from : index + part.length;

    return index;
  });
};

const tierHref = (locale: Locale, tierId: string) => `/${locale}/brief?plan=${tierId}`;

/** Карточка уровня: самый внешний предок ссылки уровня, в котором нет ссылки другого уровня. */
const tierCardText = (html: string, locale: Locale, tierId: string) => {
  const links = linksOf(html);
  const own = links.find((link) => link.href === tierHref(locale, tierId));

  if (!own) {
    return null;
  }

  const others = links.filter((link) => TIERS.some((id) => id !== tierId && link.href === tierHref(locale, id)));
  const card = elementsOf(html)
    .filter((element) => element.start <= own.start && element.end >= own.end)
    .filter((element) => !others.some((link) => link.start >= element.start && link.end <= element.end))
    .sort((a, b) => b.end - b.start - (a.end - a.start))[0];

  return textOf(html.slice(card.start, card.end));
};

const h1Text = (html: string) => {
  const h1 = elementsOf(html).find((element) => element.tag === 'h1');

  return h1 ? textOf(html.slice(h1.start, h1.end)).trim() : null;
};

/** Тексты заголовков разделов страницы (h2–h4): заголовок блока ищется среди них, а не в любом тексте. */
const headingTexts = (html: string) =>
  elementsOf(html)
    .filter((element) => ['h2', 'h3', 'h4'].includes(element.tag))
    .map((element) => textOf(html.slice(element.start, element.end)).trim());

const logoTexts = (locale: Locale) => MESSAGES[locale].services.logo;

const ROWS = DESIGN_NAMES.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

const POINTS_ROWS = POINTS_DESIGNS.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

describe('страница услуги «Логотип и фирменный стиль» во всех направлениях', () => {
  it.each(ROWS)('%s, %s: заголовок — название тарифа, лид — services.logo.lead', (design, locale) => {
    const html = renderLogo(design, locale);

    expect(html).toContain('data-service="logo"');
    expect(h1Text(html)).toBe(spaced(MESSAGES[locale].pricing.plans.logo?.name));
    expect(textOf(html)).toContain(spaced(logoTexts(locale)?.lead));
  });

  it.each(ROWS)(
    '%s, %s: три карточки уровней по порядку — название, цена без «от», срок, ссылка в квиз с уровнем',
    (design, locale) => {
      const html = renderLogo(design, locale);
      const links = linksOf(html);

      expect(html).toContain('data-service="logo"');
      expect(headingTexts(html), 'заголовок блока уровней').toContain(
        spaced(MESSAGES[locale].servicePage.logo?.tiersHeading),
      );

      const positions = TIERS.map(
        (tierId) => links.find((link) => link.href === tierHref(locale, tierId))?.start ?? -1,
      );

      expect(
        positions.every((position) => position !== -1),
        'ссылки трех уровней',
      ).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));

      for (const tierId of TIERS) {
        const texts = MESSAGES[locale].pricing.tiers[tierId];
        const card = tierCardText(html, locale, tierId);
        const price = spaced(TIER_PRICES[locale][tierId]);

        expect(card, `карточка ${tierId} со ссылкой ${tierHref(locale, tierId)}`).not.toBeNull();
        expect(card, `карточка ${tierId}: название`).toContain(spaced(texts?.name));
        expect(card, `карточка ${tierId}: срок`).toContain(spaced(texts?.term));
        expect(card, `карточка ${tierId}: цена`).toContain(price);
        expect(card, `карточка ${tierId}: без «от»`).not.toContain(`${FROM_PREFIX[locale]}${price}`);
      }
    },
  );

  it.each(POINTS_ROWS)('%s, %s: в карточке уровня — все пункты services.logo.tierPoints', (design, locale) => {
    const html = renderLogo(design, locale);

    expect(html).toContain('data-service="logo"');

    for (const tierId of TIERS) {
      const points = logoTexts(locale)?.tierPoints[tierId] ?? [];
      const card = tierCardText(html, locale, tierId);

      expect(points.length, `services.logo.tierPoints.${tierId}`).toBeGreaterThan(0);
      expect(card, `карточка ${tierId}`).not.toBeNull();

      for (const point of points) {
        expect(card, `карточка ${tierId}: пункт`).toContain(spaced(point));
      }
    }
  });

  it.each(ROWS)('%s, %s: «Что входит» — свой список логотипа, без базы сайта из 13 пунктов', (design, locale) => {
    const html = renderLogo(design, locale);
    const text = textOf(html);
    const basics = logoTexts(locale)?.basics;
    const { basics: siteBasics, basicsGroups } = MESSAGES[locale].pricing;

    expect(html).toContain('data-service="logo"');
    expect(basics?.items.length, 'services.logo.basics.items').toBeGreaterThan(0);
    expect(text).toContain(spaced(basics?.note));

    for (const item of basics?.items ?? []) {
      expect(text, 'пункт «Что входит»').toContain(spaced(item));
    }

    expect(text).not.toContain(spaced(siteBasics.lighthouse));
    expect(text).not.toContain(spaced(basicsGroups.confidence));
  });

  it.each(ROWS)('%s, %s: блока опций и ссылки «Все опции и цены» нет', (design, locale) => {
    const html = renderLogo(design, locale);

    expect(html).toContain('data-service="logo"');
    expect(html).not.toContain('data-testid="service-options"');
    expect(textOf(html)).not.toContain(spaced(MESSAGES[locale].servicePage.allOptions));
    expect(linksOf(html).map((link) => link.href)).not.toContain(`/${locale}#prices`);
  });

  it.each(ROWS)(
    '%s, %s: в процессе четыре шага логотипа по порядку, без «Перед стартом» и «Гарантии после запуска»',
    (design, locale) => {
      const html = renderLogo(design, locale);
      const steps = logoTexts(locale)?.process ?? [];
      const list = byTestId(html, 'service-steps');
      const stepsText = testIdText(html, 'service-steps') ?? '';
      const parts = steps.flatMap((step) => [step.when, step.title, step.text].map(spaced));
      const { prestartHeading, afterHeading, prestart, after } = MESSAGES[locale].process;

      expect(html).toContain('data-service="logo"');
      expect(steps, 'services.logo.process').toHaveLength(STEP_COUNT);
      expect(list && childrenOf(html, list).length, 'шаги в service-steps').toBe(STEP_COUNT);
      expect(
        positionsInOrder(stepsText, parts).every((index) => index !== -1),
        'шаги по порядку',
      ).toBe(true);

      for (const heading of [prestartHeading, afterHeading]) {
        expect(textOf(html), 'заголовок карточек процесса').not.toContain(spaced(heading));
      }

      for (const card of [...Object.values(prestart), ...Object.values(after)]) {
        expect(textOf(html), 'карточка процесса сайта').not.toContain(spaced(card.text));
      }
    },
  );

  it.each(ROWS)('%s, %s: восемь вопросов FAQ по порядку с ответами, в JSON-LD — те же восемь пар', (design, locale) => {
    const html = renderLogo(design, locale);
    const faq = logoTexts(locale)?.faq ?? [];
    const faqText = testIdText(html, 'service-faq') ?? '';
    const parts = faq.flatMap((item) => [item.question, item.answer].map(spaced));
    const jsonLd = serviceFaqJsonLd(MESSAGES[locale] as unknown as ServiceMessages, 'logo', locale);

    expect(html).toContain('data-service="logo"');
    expect(faq, 'services.logo.faq').toHaveLength(FAQ_COUNT);
    expect(
      positionsInOrder(faqText, parts).every((index) => index !== -1),
      'вопросы и ответы по порядку',
    ).toBe(true);
    expect(jsonLd?.mainEntity.map((entity) => ({ question: entity.name, answer: entity.acceptedAnswer.text }))).toEqual(
      faq.map((item) => ({ question: item.question, answer: item.answer })),
    );
  });

  it.each(ROWS)(
    '%s, %s: шапка и карточка справа — без раундов сайта, гарантии и Lighthouse, цена «от», свой вид цены, кнопка в квиз',
    (design, locale) => {
      const html = renderLogo(design, locale);
      const text = textOf(html);
      const { servicePage, pricing } = MESSAGES[locale];
      const fromPrice = spaced(pricing.price.from.replace('{amount}', PLAN_PRICES[locale]));

      expect(html).toContain('data-service="logo"');
      expect(text).not.toContain(spaced(servicePage.revisions));
      expect(text).not.toContain(spaced(servicePage.cardPoints.warranty));
      expect(text).not.toContain(spaced(pricing.basics.lighthouse));
      expect(text).toContain(spaced(servicePage.cardPoints.deadline));
      expect(text).toContain(fromPrice);
      expect(text).toContain(spaced(pricing.plans.logo?.term));
      expect(text).toContain(spaced(servicePage.logo?.priceKind));
      expect(text).not.toContain(spaced(servicePage.priceKind.from));
      expect(linksOf(html).map((link) => link.href)).toContain(`/${locale}/brief?plan=logo`);
    },
  );

  it.each(ROWS)('%s, %s: нет ссылок href="#", на /work и на примеры', (design, locale) => {
    const html = renderLogo(design, locale);
    const hrefs = linksOf(html).map((link) => link.href ?? '');

    expect(html).toContain('data-service="logo"');
    expect(hrefs.filter((href) => href === '#')).toEqual([]);
    expect(hrefs.filter((href) => href.startsWith(`/${locale}/work`))).toEqual([]);
    expect(hrefs.filter((href) => /^https?:\/\//.test(href))).toEqual([]);
  });
});
