import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import type { ServicePageData } from '@/components/ServicePage/types';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import { PRICING_TIERS } from '@/content/pricing';
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

type PriceKinds = { exact: string; from: string; month: string };

type Messages = {
  pricing: { tiers: Record<string, TierTexts | undefined> };
  servicePage: { priceKind: PriceKinds; perMonth: string };
};

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

type ProbeProps = { serviceId: string; onData: (data: ServicePageData | null) => void };

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

/** Хостинг и три уровня поддержки — по порядку карточек на странице. */
const TIERS = ['hostingBackups', 'supportHours', 'supportHoursPlus', 'supportHoursPro'] as const;

/** Сумма карточки, как ее печатает сайт: точная, без «от». */
const TIER_PRICES: Record<Locale, Record<(typeof TIERS)[number], string>> = {
  ru: {
    hostingBackups: '7\u00a0000\u00a0₽',
    supportHours: '15\u00a0000\u00a0₽',
    supportHoursPlus: '35\u00a0000\u00a0₽',
    supportHoursPro: '70\u00a0000\u00a0₽',
  },
  en: {
    hostingBackups: '$140',
    supportHours: '$250',
    supportHoursPlus: '$700',
    supportHoursPro: '$1,400',
  },
};

/** Цена «от» в языке страницы: такой подписи у карточек поддержки быть не должно. */
const FROM_PREFIX: Record<Locale, string> = { ru: 'от ', en: 'from ' };

/** Часы работы в месяц у трех уровней: число входит в название. */
const TIER_HOURS: Partial<Record<(typeof TIERS)[number], number>> = {
  supportHours: 3,
  supportHoursPlus: 10,
  supportHoursPro: 25,
};

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

const renderSupport = (design: DesignName, locale: Locale) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] },
      SECTIONS[design]({ section: 'servicePage', service: 'support' } as unknown as SectionProps),
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

const spaced = (text: string) => text.replaceAll(NBSP, ' ');

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

const linksOf = (html: string): Link[] =>
  elementsOf(html)
    .filter((element) => element.tag === 'a')
    .map((element) => {
      const markup = html.slice(element.start, element.end);

      return { ...element, href: attrOf(markup.slice(0, markup.indexOf('>') + 1), 'href') };
    });

/** Ссылка карточки — на бриф с этим вариантом тарифа, как у 3D. */
const tierHref = (locale: Locale, tierId: string) => `/${locale}/brief?plan=${tierId}`;

/** Текст карточки варианта: самый внешний предок ссылки варианта, в котором нет ссылки другого варианта. */
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

const tierTexts = (locale: Locale, tierId: string) => MESSAGES[locale].pricing.tiers[tierId];

const ROWS = DESIGN_NAMES.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

describe('страница услуги «Поддержка» во всех направлениях: хостинг и три уровня карточками', () => {
  it.each(ROWS)('%s, %s: четыре карточки по порядку, у каждой ссылка на бриф с этим вариантом', (design, locale) => {
    const html = renderSupport(design, locale);
    const links = linksOf(html);

    expect(html).toContain('data-service="support"');

    const positions = TIERS.map((tierId) => {
      const own = links.find((link) => link.href === tierHref(locale, tierId));

      expect(own, `ссылка ${tierHref(locale, tierId)}`).toBeDefined();

      return own?.start ?? -1;
    });

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it.each(ROWS)('%s, %s: название, описание и срок карточки — из перевода варианта дословно', (design, locale) => {
    const html = renderSupport(design, locale);

    for (const tierId of TIERS) {
      const texts = tierTexts(locale, tierId);
      const card = tierCardText(html, locale, tierId);

      expect(card, `карточка ${tierId} со ссылкой ${tierHref(locale, tierId)}`).not.toBeNull();
      expect(texts, `pricing.tiers.${tierId}`).toEqual({
        name: expect.stringMatching(/\S/),
        summary: expect.stringMatching(/\S/),
        term: expect.stringMatching(/\S/),
      });
      expect(card, `карточка ${tierId}: название`).toContain(spaced(texts?.name ?? '\u0000'));
      expect(card, `карточка ${tierId}: описание`).toContain(spaced(texts?.summary ?? '\u0000'));
      expect(card, `карточка ${tierId}: срок`).toContain(spaced(texts?.term ?? '\u0000'));
    }
  });

  it.each(ROWS)('%s, %s: цена карточки — сумма варианта без «от»', (design, locale) => {
    const html = renderSupport(design, locale);

    for (const tierId of TIERS) {
      const card = tierCardText(html, locale, tierId);
      const price = spaced(TIER_PRICES[locale][tierId]);

      expect(card, `карточка ${tierId} со ссылкой ${tierHref(locale, tierId)}`).not.toBeNull();
      expect(card, `карточка ${tierId}: цена`).toContain(price);
      expect(card, `карточка ${tierId}: без «от»`).not.toContain(`${FROM_PREFIX[locale]}${price}`);
    }
  });

  it.each([...LOCALES])('%s: у трех уровней число часов из данных входит в название', (locale) => {
    for (const [tierId, hours] of Object.entries(TIER_HOURS)) {
      const tier = PRICING_TIERS.find((item) => item.id === tierId) as { hours?: number } | undefined;
      const name = spaced(tierTexts(locale, tierId)?.name ?? '');

      expect(tier?.hours, `${tierId}.hours`).toBe(hours);
      expect(name, `название ${tierId}`).toMatch(new RegExp(`(^|\\D)${hours}(\\D|$)`));
    }
  });
});

const Probe = ({ serviceId, onData }: ProbeProps) => {
  onData(useServicePage(serviceId));

  return null;
};

/** Данные страницы услуги так, как их получает разметка направления. */
const servicePageData = (locale: Locale, serviceId: string) => {
  let data: ServicePageData | null = null;

  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] },
      createElement(Probe, {
        serviceId,
        onData: (value) => {
          data = value;
        },
      }),
    ),
  );

  return data as ServicePageData | null;
};

const priceKinds = (locale: Locale) => MESSAGES[locale].servicePage.priceKind;

describe('вид цены карточек поддержки: только метка «ежемесячно», у 3D — прежний', () => {
  it.each([...LOCALES])('%s: в данных страницы у четырех карточек поддержки вида цены нет', (locale) => {
    const items = servicePageData(locale, 'support')?.tiers?.items ?? [];

    expect(items.map(({ id, kind }) => ({ id, hasKind: Boolean(kind) }))).toEqual(
      TIERS.map((id) => ({ id, hasKind: false })),
    );
  });

  it.each([...LOCALES])(
    '%s: у карточек 3D вид цены прежний — «от» или «фиксированная» по isFrom варианта',
    (locale) => {
      const kinds = priceKinds(locale);
      const threeDTiers = PRICING_TIERS.filter((tier) => tier.planId === 'threeD');
      const items = servicePageData(locale, 'threeD')?.tiers?.items ?? [];

      expect(threeDTiers.length, 'варианты 3D в прайсе').toBeGreaterThan(0);
      expect(items.map(({ id, kind }) => ({ id, kind }))).toEqual(
        threeDTiers.map((tier) => ({ id: tier.id, kind: tier.isFrom ? kinds.from : kinds.exact })),
      );
    },
  );

  it.each(ROWS)('%s, %s: карточка поддержки без надзаголовка вида цены и без «/ мес» у суммы', (design, locale) => {
    const html = renderSupport(design, locale);
    const kinds = priceKinds(locale);

    for (const tierId of TIERS) {
      const card = tierCardText(html, locale, tierId);
      const perMonth = MESSAGES[locale].servicePage.perMonth.replace('{price}', TIER_PRICES[locale][tierId]);

      expect(card, `карточка ${tierId} со ссылкой ${tierHref(locale, tierId)}`).not.toBeNull();
      expect(card, `карточка ${tierId}: без вида «от»`).not.toContain(spaced(kinds.from));
      expect(card, `карточка ${tierId}: без вида «фиксированная»`).not.toContain(spaced(kinds.exact));
      expect(card, `карточка ${tierId}: без надзаголовка «за месяц»`).not.toContain(spaced(kinds.month));
      expect(card, `карточка ${tierId}: сумма без «/ мес»`).not.toContain(spaced(perMonth));
    }
  });
});

/** Направления, у которых над названием карточки варианта есть надзаголовок вида цены. */
const KICKER_DESIGNS = ['kinetic', 'terminal'] as const satisfies readonly DesignName[];

const KICKER_ROWS = KICKER_DESIGNS.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

const THREE_D_TIERS = PRICING_TIERS.filter((tier) => tier.planId === 'threeD');

const renderServicePage = (design: DesignName, locale: Locale, service: string) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] },
      SECTIONS[design]({ section: 'servicePage', service } as unknown as SectionProps),
    ),
  );

/** Карточка варианта: самый внешний предок ссылки варианта, в котором нет ссылки другого варианта той же страницы. */
const tierCardOf = (html: string, locale: Locale, tierId: string, tierIds: readonly string[]) => {
  const links = linksOf(html);
  const own = links.find((link) => link.href === tierHref(locale, tierId));

  if (!own) {
    return null;
  }

  const others = links.filter((link) => tierIds.some((id) => id !== tierId && link.href === tierHref(locale, id)));

  return (
    elementsOf(html)
      .filter((element) => element.start <= own.start && element.end >= own.end)
      .filter((element) => !others.some((link) => link.start >= element.start && link.end <= element.end))
      .sort((a, b) => b.end - b.start - (a.end - a.start))[0] ?? null
  );
};

/**
 * Тексты элементов карточки над ее названием: элементы, которые целиком стоят раньше заголовка с названием
 * (его предки — нет), без вложенных друг в друга. `null` — названия в карточке не нашлось.
 */
const textsBeforeName = (html: string, card: Element, name: string) => {
  const inside = elementsOf(html).filter((element) => element.start > card.start && element.end <= card.end);
  const heading = inside
    .filter((element) => textOf(html.slice(element.start, element.end)).trim() === spaced(name))
    .sort((a, b) => a.end - a.start - (b.end - b.start))[0];

  if (!heading) {
    return null;
  }

  const before = inside.filter((element) => element.end <= heading.start);

  return before
    .filter(
      (element) =>
        !before.some((other) => other !== element && other.start <= element.start && other.end >= element.end),
    )
    .map((element) => textOf(html.slice(element.start, element.end)).trim());
};

describe('надзаголовок вида цены в карточках Kinetic и Terminal: у 3D есть, у поддержки нет совсем', () => {
  it.each(KICKER_ROWS)(
    '%s, %s: у каждой карточки 3D над названием надзаголовок — «от» или «фиксированная» по isFrom варианта',
    (design, locale) => {
      const html = renderServicePage(design, locale, 'threeD');
      const kinds = priceKinds(locale);
      const ids = THREE_D_TIERS.map((tier) => tier.id);

      expect(THREE_D_TIERS.length, 'варианты 3D в прайсе').toBeGreaterThan(0);

      for (const tier of THREE_D_TIERS) {
        const card = tierCardOf(html, locale, tier.id, ids);
        const name = tierTexts(locale, tier.id)?.name ?? '';
        const kind = tier.isFrom ? kinds.from : kinds.exact;

        expect(card, `карточка ${tier.id} со ссылкой ${tierHref(locale, tier.id)}`).not.toBeNull();
        expect(name, `pricing.tiers.${tier.id}.name`).toMatch(/\S/);
        expect(kind, `servicePage.priceKind для ${tier.id}`).toMatch(/\S/);
        expect(card && textsBeforeName(html, card, name), `карточка ${tier.id}: над названием`).toEqual([spaced(kind)]);
      }
    },
  );

  it.each(KICKER_ROWS)(
    '%s, %s: у четырех карточек поддержки над названием нет ни одного элемента, даже пустого',
    (design, locale) => {
      const html = renderServicePage(design, locale, 'support');

      for (const tierId of TIERS) {
        const card = tierCardOf(html, locale, tierId, TIERS);
        const name = tierTexts(locale, tierId)?.name ?? '';

        expect(card, `карточка ${tierId} со ссылкой ${tierHref(locale, tierId)}`).not.toBeNull();
        expect(name, `pricing.tiers.${tierId}.name`).toMatch(/\S/);
        expect(card && textsBeforeName(html, card, name), `карточка ${tierId}: над названием`).toEqual([]);
      }
    },
  );
});
