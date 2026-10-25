import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { INDUSTRY_NICHES, industryNicheHref } from '@/content/industry';
import { SERVICES } from '@/content/services';
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

type Messages = typeof ru;

type Niche = (typeof INDUSTRY_NICHES)[number];

type ProviderProps = { locale: string; messages: Messages; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

type Link = Element & { href: string | null; target: string | null; rel: string | null; text: string };

const DENTAL_DEMO = 'https://dental.mrshkn.com';
const EXPERT_DEMO = 'https://expert.mrshkn.com';
const COFFEE_DEMO = 'https://coffee.mrshkn.com';
const LAUNCH_DEMO = 'https://launch.mrshkn.com';
const DENTAL_TG = 'https://t.me/mrshkn_dental_bot';
const DENTAL_MAX = 'https://max.ru/se14753310_bot?startapp';
const COFFEE_TG = 'https://t.me/mrshkn_coffee_bot?startapp';

const NICHE_DEMOS: Record<Niche, string> = {
  clinic: DENTAL_DEMO,
  expert: EXPERT_DEMO,
  horeca: COFFEE_DEMO,
};

const BOT_LINKS = [DENTAL_TG, DENTAL_MAX, COFFEE_TG];

const CLINIC_BOTS = [DENTAL_TG, DENTAL_MAX];

const COFFEE_BOTS = [COFFEE_TG];

/** Адреса сайтов-демо: подстрока ищется с границей имени хоста. */
const HOST_URLS = [DENTAL_DEMO, EXPERT_DEMO, COFFEE_DEMO, LAUNCH_DEMO];

const URLS = [...HOST_URLS, ...BOT_LINKS];

const CONSTS_FILE = 'src/lib/consts.ts';

const ROOT = resolve(import.meta.dirname, '../..');

const NBSP = String.fromCodePoint(0x00a0);

const T = {
  ru: {
    nicheDemo: 'Открыть демо',
    landingExample: 'Посмотреть пример',
    'tryIt.heading': 'Попробовать',
    'tryIt.note': 'Откройте с\u00a0телефона и\u00a0пройдите путь клиента',
    'tryIt.mark': 'Демо-проект студии',
    'tryIt.telegram': 'Открыть в\u00a0Telegram',
    'tryIt.max': 'Открыть в\u00a0MAX',
    'tryIt.apps.clinic.title': 'Клиника',
    'tryIt.apps.clinic.module': 'Запись',
    'tryIt.apps.clinic.text':
      'Клиент выбирает услугу, врача и\u00a0время, а\u00a0запись приходит владельцу в\u00a0Telegram',
    'tryIt.apps.coffee.title': 'Кофейня',
    'tryIt.apps.coffee.module': 'Лояльность',
    'tryIt.apps.coffee.text': 'Штампы за\u00a0покупки по\u00a0QR-коду у\u00a0кассы, меню и\u00a0заказ заранее',
  },
  en: {
    nicheDemo: 'Open demo',
    landingExample: 'See an example',
    'tryIt.heading': 'Try it',
    'tryIt.note': 'Open it on your phone and go through it as a customer. The interface is in Russian',
    'tryIt.mark': 'Studio demo project',
    'tryIt.telegram': 'Open in Telegram',
    'tryIt.max': 'Open in MAX',
    'tryIt.apps.clinic.title': 'Clinic',
    'tryIt.apps.clinic.module': 'Booking',
    'tryIt.apps.clinic.text':
      'The customer picks a service, a doctor and a time, and the booking goes to the owner in Telegram',
    'tryIt.apps.coffee.title': 'Coffee shop',
    'tryIt.apps.coffee.module': 'Loyalty',
    'tryIt.apps.coffee.text': 'Collect stamps with a QR code at the till, browse the menu and order ahead',
  },
} as const;

type TextKey = keyof (typeof T)['ru'];

const MESSAGES: Record<Locale, Messages> = { ru, en: en as Messages };

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
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

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const renderService = (design: DesignName, locale: Locale, service: string) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, messages: MESSAGES[locale] },
      SECTIONS[design]({ section: 'servicePage', service } as unknown as SectionProps),
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

const textOf = (html: string) => decode(html.replace(/<[^>]*>/g, ''));

const spaced = (text: string) => text.replaceAll(NBSP, ' ');

/** Значение по пути «a.b.c» в `servicePage` файла сообщений языка; нет ключа — `undefined`. */
const messageAt = (locale: Locale, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
      (MESSAGES[locale] as unknown as Record<string, unknown>).servicePage,
    );

/**
 * Текст ключа для поиска в разметке. Нет ключа → строка, которой в разметке быть не может:
 * next-intl на месте пропущенного ключа рисует путь ключа, и тест не должен принять его за текст.
 */
const shown = (locale: Locale, path: string) => {
  const value = messageAt(locale, path);

  return typeof value === 'string' ? spaced(value) : `⟨нет ключа servicePage.${path}⟩`;
};

const attrOf = (openTag: string, name: string) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(openTag);

  return match ? decode(match[1]) : null;
};

/** Элементы разметки с границами: по ним находится карточка вокруг ссылки. */
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
      const openTag = markup.slice(0, markup.indexOf('>') + 1);

      return {
        ...element,
        href: attrOf(openTag, 'href'),
        target: attrOf(openTag, 'target'),
        rel: attrOf(openTag, 'rel'),
        text: textOf(markup),
      };
    });

const h2Texts = (html: string) => [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map(([, inner]) => textOf(inner));

const inside = (inner: Element, outer: Element) => inner.start >= outer.start && inner.end <= outer.end;

/**
 * Карточка ссылки — самый широкий ее предок, внутри которого нет ни одной ссылки из `foreign`
 * (ссылок других карточек). `null` — у ссылки нет такого предка.
 */
const cardOf = (html: string, link: Element, foreign: (link: Link) => boolean): Element | null => {
  const others = linksOf(html).filter((item) => item.start !== link.start && foreign(item));
  const ancestors = elementsOf(html)
    .filter((element) => inside(link, element))
    .filter((element) => !others.some((item) => inside(item, element)));

  return ancestors.reduce<Element | null>(
    (widest, element) =>
      widest === null || element.end - element.start > widest.end - widest.start ? element : widest,
    null,
  );
};

const relTokens = (link: Link) => (link.rel ?? '').split(/\s+/).filter(Boolean);

const expectNewTab = (link: Link, label: string) => {
  expect(link.target, `${label}: target`).toBe('_blank');
  expect(relTokens(link), `${label}: rel`).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
};

const isBotHref = (href: string | null) =>
  href !== null && (href.startsWith('https://t.me/mrshkn_') || href.startsWith('https://max.ru/'));

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countIn = (source: string, url: string) => {
  const pattern = HOST_URLS.includes(url)
    ? new RegExp(`${escapeRegExp(url)}(?![A-Za-z0-9.-])`, 'g')
    : new RegExp(escapeRegExp(url), 'g');

  return [...source.matchAll(pattern)].length;
};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

const SCANNED_FILES = [
  ...sourceFiles(join(ROOT, 'src')),
  join(ROOT, 'messages/ru.json'),
  join(ROOT, 'messages/en.json'),
].map((path) => ({ file: relative(ROOT, path), source: readFileSync(path, 'utf8') }));

const ROWS = DESIGN_NAMES.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

const OTHER_ROWS = DESIGN_NAMES.flatMap((design) =>
  LOCALES.flatMap((locale) =>
    SERVICES.filter((service) => service.id !== 'miniApp').map((service) => [design, locale, service.id] as const),
  ),
);

const NOT_LANDING_ROWS = DESIGN_NAMES.flatMap((design) =>
  LOCALES.flatMap((locale) =>
    SERVICES.filter((service) => service.id !== 'landing').map((service) => [design, locale, service.id] as const),
  ),
);

const KEYS_RU = Object.keys(T.ru) as TextKey[];

const KEYS_EN = Object.keys(T.en) as TextKey[];

describe('«Открыть демо» на странице отраслевого сайта', () => {
  it.each(ROWS)('%s, %s: в карточке каждой ниши — ссылка на ее демо', (design, locale) => {
    const html = renderService(design, locale, 'industry');
    const links = linksOf(html);

    for (const niche of INDUSTRY_NICHES) {
      const demo = NICHE_DEMOS[niche];
      const demoLinks = links.filter((link) => link.href === demo);

      expect(demoLinks.length, `ссылок на демо ${niche} (${demo})`).toBe(1);

      const [demoLink] = demoLinks;

      expect(demoLink.text, `текст ссылки на демо ${niche}`).toContain(shown(locale, 'nicheDemo'));

      const ownHrefs = [demo, industryNicheHref(locale, niche)];
      const foreignHrefs = INDUSTRY_NICHES.filter((item) => item !== niche).flatMap((item) => [
        NICHE_DEMOS[item],
        industryNicheHref(locale, item),
      ]);
      const card = cardOf(html, demoLink, (link) => link.href !== null && foreignHrefs.includes(link.href));
      const quizLink = links.find((link) => link.href === ownHrefs[1]);

      expect(quizLink, `ссылка ниши ${niche} в квиз`).toBeDefined();
      expect(card, `карточка демо ${niche}`).not.toBeNull();
      expect(inside(quizLink!, card!), `демо ${niche} и ссылка в квиз — в одной карточке`).toBe(true);
    }
  });

  it.each(ROWS)('%s, %s: ссылки на демо ниш открываются в новой вкладке', (design, locale) => {
    const links = linksOf(renderService(design, locale, 'industry'));

    for (const demo of [DENTAL_DEMO, EXPERT_DEMO, COFFEE_DEMO]) {
      const demoLinks = links.filter((link) => link.href === demo);

      expect(demoLinks.length, `ссылок на ${demo}`).toBeGreaterThan(0);

      for (const link of demoLinks) {
        expectNewTab(link, demo);
      }
    }
  });

  it.each(ROWS)('%s, %s: ссылки не вложены друг в друга', (design, locale) => {
    const links = linksOf(renderService(design, locale, 'industry'));
    const nested = links.filter((link) => links.some((outer) => outer.start !== link.start && inside(link, outer)));

    expect(nested.map((link) => link.href)).toEqual([]);
  });

  it.each(ROWS)('%s, %s: на странице лендинга — «Посмотреть пример» на launch в новой вкладке', (design, locale) => {
    const links = linksOf(renderService(design, locale, 'landing')).filter((link) => link.href === LAUNCH_DEMO);

    expect(links.length, `ссылок на ${LAUNCH_DEMO}`).toBe(1);
    expect(links[0].text).toContain(shown(locale, 'landingExample'));
    expectNewTab(links[0], LAUNCH_DEMO);
  });

  it.each(NOT_LANDING_ROWS)('%s, %s, %s: на странице другой услуги ссылки на launch нет', (design, locale, service) => {
    const html = renderService(design, locale, service);

    expect(html).toContain(`data-service="${service}"`);
    expect(linksOf(html).filter((link) => link.href === LAUNCH_DEMO)).toEqual([]);
  });
});

describe('«Попробовать» на странице Mini App', () => {
  it.each(ROWS)('%s, %s: три ссылки на ботов демо в своих карточках', (design, locale) => {
    const html = renderService(design, locale, 'miniApp');
    const bots = linksOf(html).filter((link) => isBotHref(link.href));

    expect(bots.map((link) => link.href).sort()).toEqual([...BOT_LINKS].sort());

    const cards = [
      { bots: CLINIC_BOTS, foreign: COFFEE_BOTS, title: 'tryIt.apps.clinic.title' },
      { bots: COFFEE_BOTS, foreign: CLINIC_BOTS, title: 'tryIt.apps.coffee.title' },
    ];
    const texts: Record<string, string> = {
      [DENTAL_TG]: 'tryIt.telegram',
      [DENTAL_MAX]: 'tryIt.max',
      [COFFEE_TG]: 'tryIt.telegram',
    };

    for (const { bots: own, foreign, title } of cards) {
      for (const href of own) {
        const link = bots.find((item) => item.href === href)!;
        const card = cardOf(html, link, (item) => item.href !== null && foreign.includes(item.href));

        expect(link.text, `текст ссылки ${href}`).toContain(shown(locale, texts[href]));
        expect(card, `карточка ссылки ${href}`).not.toBeNull();
        expect(textOf(html.slice(card!.start, card!.end)), `название карточки ${href}`).toContain(shown(locale, title));
        expectNewTab(link, href);
      }
    }
  });

  it.each(ROWS)(
    '%s, %s: раздел с заголовком, пометкой «демо-проект студии» и названием модуля в каждой карточке',
    (design, locale) => {
      const html = renderService(design, locale, 'miniApp');
      const heading = shown(locale, 'tryIt.heading');

      expect(
        h2Texts(html).some((text) => text.includes(heading)),
        `h2 «${heading}»`,
      ).toBe(true);
      expect(textOf(html)).toContain(shown(locale, 'tryIt.note'));

      const links = linksOf(html);
      const cards = [
        { href: DENTAL_TG, foreign: COFFEE_BOTS, app: 'clinic' },
        { href: COFFEE_TG, foreign: CLINIC_BOTS, app: 'coffee' },
      ];

      for (const { href, foreign, app } of cards) {
        const link = links.find((item) => item.href === href);

        expect(link, `ссылка ${href}`).toBeDefined();

        const card = cardOf(html, link!, (item) => item.href !== null && foreign.includes(item.href));

        expect(card, `карточка ${app}`).not.toBeNull();

        const cardText = textOf(html.slice(card!.start, card!.end));

        for (const key of [`tryIt.apps.${app}.module`, `tryIt.apps.${app}.text`, 'tryIt.mark']) {
          expect(cardText, `карточка ${app}: ${key}`).toContain(shown(locale, key));
        }
      }
    },
  );

  it.each(OTHER_ROWS)('%s, %s, %s: на странице другой услуги ссылок на ботов демо нет', (design, locale, service) => {
    const html = renderService(design, locale, service);
    const heading = shown(locale, 'tryIt.heading');

    expect(html).toContain(`data-service="${service}"`);
    expect(
      linksOf(html)
        .map((link) => link.href)
        .filter((href) => href !== null && BOT_LINKS.includes(href)),
    ).toEqual([]);
    expect(h2Texts(html).filter((text) => text.includes(heading))).toEqual([]);
  });
});

describe('адреса демо и ботов — в src/lib/consts.ts', () => {
  it.each(URLS)('%s: строка есть только в src/lib/consts.ts, один раз', (url) => {
    const found = Object.fromEntries(
      SCANNED_FILES.map(({ file, source }) => [file, countIn(source, url)] as const).filter(([, count]) => count > 0),
    );

    expect(found).toEqual({ [CONSTS_FILE]: 1 });
  });
});

describe('тексты блока дословно', () => {
  it.each(KEYS_RU)('ru: %s равно утвержденному', (key) => {
    expect(messageAt('ru', key)).toBe(T.ru[key]);
  });

  it.each(KEYS_EN)('en: %s равно утвержденному', (key) => {
    expect(messageAt('en', key)).toBe(T.en[key]);
  });
});
