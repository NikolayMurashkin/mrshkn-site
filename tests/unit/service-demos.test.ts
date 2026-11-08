import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
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

type ProviderProps = { locale: string; messages: Messages; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

type Link = Element & { href: string | null; target: string | null; rel: string | null; text: string };

const DENTAL_DEMO = 'https://dental.mrshkn.com';
const EXPERT_DEMO = 'https://expert.mrshkn.com';
const COFFEE_DEMO = 'https://coffee.mrshkn.com';
const EVENT_DEMO = 'https://event.mrshkn.com';
/** Прежний пример лендинга: с него теперь редирект на концерт, в коде сайта адреса быть не должно. */
const OLD_LAUNCH_DEMO = 'https://launch.mrshkn.com';
const DENTAL_TG = 'https://t.me/mrshkn_dental_bot';
const DENTAL_MAX = 'https://max.ru/se14753310_bot?startapp';
const COFFEE_TG = 'https://t.me/mrshkn_coffee_bot?startapp';
const SALON_DEMO = 'https://salon.mrshkn.com';
/** Бот салона без `?startapp`: приложение открывает кнопка меню бота. */
const SALON_TG = 'https://t.me/mrshkn_salon_bot';

/**
 * Карточки ниш страницы отраслевого сайта по порядку: демо и ниша квиза. У салона своей ниши в квизе нет —
 * «Обсудить сайт» открывает квиз с нишей «Кафе, бар, салон красоты».
 */
const NICHE_CARDS = [
  { niche: 'clinic', demo: DENTAL_DEMO, quizNiche: 'clinic' },
  { niche: 'expert', demo: EXPERT_DEMO, quizNiche: 'expert' },
  { niche: 'horeca', demo: COFFEE_DEMO, quizNiche: 'horeca' },
  { niche: 'beauty', demo: SALON_DEMO, quizNiche: 'horeca' },
] as const;

const NICHE_DEMOS: readonly string[] = NICHE_CARDS.map((card) => card.demo);

const BOT_LINKS = [DENTAL_TG, DENTAL_MAX, COFFEE_TG, SALON_TG];

const CLINIC_BOTS = [DENTAL_TG, DENTAL_MAX];

const COFFEE_BOTS = [COFFEE_TG];

const SALON_BOTS = [SALON_TG];

/** Карточки раздела «Попробовать» по порядку: ключ текстов `tryIt.apps.<app>` и ссылки на ботов карточки. */
const TRY_IT_CARDS = [
  { app: 'clinic', bots: CLINIC_BOTS },
  { app: 'coffee', bots: COFFEE_BOTS },
  { app: 'salon', bots: SALON_BOTS },
] as const;

/** Адреса сайтов-демо: подстрока ищется с границей имени хоста. */
const HOST_URLS = [DENTAL_DEMO, EXPERT_DEMO, COFFEE_DEMO, SALON_DEMO, EVENT_DEMO];

const URLS = [...HOST_URLS, ...BOT_LINKS];

const CONSTS_FILE = 'src/lib/consts.ts';

const ROOT = resolve(import.meta.dirname, '../..');

const NBSP = String.fromCodePoint(0x00a0);

const RU_BEAUTY_TEXT =
  'Страница каждого мастера с\u00a0фото и\u00a0его услугами, цены на\u00a0все услуги, отзывы гостей, адрес и\u00a0карта. Заявка на\u00a0запись: гость оставляет ее на\u00a0сайте, она приходит вам в\u00a0Telegram и\u00a0на\u00a0почту, время вы согласуете с\u00a0гостем сами. Когда сайт готов, вы сами добавляете и\u00a0убираете мастеров, правите их описания и\u00a0цены, добавляете отзывы гостей\u00a0— в\u00a0админке, вашем разделе сайта для таких правок. В\u00a0нашем примере сайта кнопка «Записаться» открывает приложение прямо в\u00a0Telegram: гость сам выбирает мастера и\u00a0время, перед визитом ему приходят напоминания, скачивать ничего не нужно. Это приложение заказывается отдельно и\u00a0в\u00a0цену сайта не входит, цена\u00a0— в\u00a0тарифе «Отраслевое приложение в\u00a0Telegram». У\u00a0приложения своя админка: мастеров, услуги и\u00a0цены в\u00a0нем вы ведете отдельно от\u00a0сайта. Без приложения кнопка «Записаться» на\u00a0вашем сайте открывает форму заявки, а\u00a0с\u00a0ним форма остается на\u00a0странице записи для гостей без Telegram';

const EN_BEAUTY_TEXT =
  'A page for each specialist with a photo and their services, prices for every service, guest reviews, an address and a map. Booking requests: a guest leaves one on the site and it comes to your Telegram and email, and you agree on the time with the guest yourself. Once the site is ready, you add and remove specialists, edit their descriptions and prices and add guest reviews yourself — in the admin panel, your section of the site for such edits. In our sample site, the “Book” button opens an app right inside Telegram: guests pick a specialist and a time themselves, get reminders before the visit and have nothing to download. The app is ordered separately and is not included in the site price; its price is in the “Industry app in Telegram” plan. The app has its own admin panel: you manage specialists, services and prices there separately from the site. Without the app, the “Book” button on your site opens a request form; with it, the form stays on the booking page for guests without Telegram';

const T = {
  ru: {
    nicheDemo: 'Открыть пример сайта',
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
    'tryIt.apps.coffee.module': 'Бонусы',
    'tryIt.apps.coffee.text': 'Штампы за\u00a0покупки по\u00a0QR-коду у\u00a0кассы, меню и\u00a0заказ заранее',
    'tryIt.apps.salon.title': 'Салон красоты',
    'tryIt.apps.salon.module': 'Запись',
    'tryIt.apps.salon.text':
      'Клиент прямо в\u00a0Telegram выбирает услугу, мастера и\u00a0время, а\u00a0запись приходит владельцу салона в\u00a0Telegram',
  },
  en: {
    nicheDemo: 'Open a sample site',
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
    'tryIt.apps.coffee.module': 'Bonuses',
    'tryIt.apps.coffee.text': 'Collect stamps with a QR code at the till, browse the menu and order ahead',
    'tryIt.apps.salon.title': 'Beauty salon',
    'tryIt.apps.salon.module': 'Booking',
    'tryIt.apps.salon.text':
      'The customer picks a service, a specialist and a time right inside Telegram, and the booking goes to the salon owner in Telegram',
  },
} as const;

type TextKey = keyof (typeof T)['ru'];

/** Тексты карточки ниши салона: путь — от корня файла сообщений, а не от `servicePage`. */
const ROOT_T = {
  ru: {
    'services.industry.niches.beauty.title': 'Салон красоты',
    'services.industry.niches.beauty.text': RU_BEAUTY_TEXT,
  },
  en: {
    'services.industry.niches.beauty.title': 'Beauty salon',
    'services.industry.niches.beauty.text': EN_BEAUTY_TEXT,
  },
} as const;

type RootTextKey = keyof (typeof ROOT_T)['ru'];

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

/** Значение по пути «a.b.c» от корня файла сообщений языка; нет ключа — `undefined`. */
const messageFrom = (locale: Locale, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
      MESSAGES[locale] as unknown,
    );

/** Значение по пути «a.b.c» в `servicePage` файла сообщений языка; нет ключа — `undefined`. */
const messageAt = (locale: Locale, path: string): unknown => messageFrom(locale, `servicePage.${path}`);

/**
 * Текст ключа (путь от корня сообщений) для поиска в разметке. Нет ключа → строка, которой в разметке быть
 * не может: next-intl на месте пропущенного ключа рисует путь ключа, и тест не должен принять его за текст.
 */
const shownFrom = (locale: Locale, path: string) => {
  const value = messageFrom(locale, path);

  return typeof value === 'string' ? spaced(value) : `⟨нет ключа ${path}⟩`;
};

const shown = (locale: Locale, path: string) => shownFrom(locale, `servicePage.${path}`);

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

/** Ссылка на демо другой ниши: граница карточки. Ссылки в квиз у кофейни и салона совпадают — не граница. */
const isForeignDemo = (link: Link, own: string) =>
  link.href !== null && link.href !== own && NICHE_DEMOS.includes(link.href);

/** Ссылка на бота другой карточки «Попробовать»: граница карточки. */
const isForeignBot = (link: Link, own: readonly string[]) =>
  link.href !== null && BOT_LINKS.includes(link.href) && !own.includes(link.href);

const isBotHref = (href: string | null) =>
  href !== null && (href.startsWith('https://t.me/mrshkn_') || href.startsWith('https://max.ru/'));

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countIn = (source: string, url: string) => {
  const pattern = [...HOST_URLS, OLD_LAUNCH_DEMO].includes(url)
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

const ROOT_KEYS_RU = Object.keys(ROOT_T.ru) as RootTextKey[];

const ROOT_KEYS_EN = Object.keys(ROOT_T.en) as RootTextKey[];

describe('«Открыть демо» на странице отраслевого сайта', () => {
  it.each(ROWS)('%s, %s: в карточке каждой ниши — ссылка на ее демо', (design, locale) => {
    const html = renderService(design, locale, 'industry');
    const links = linksOf(html);

    for (const { niche, demo, quizNiche } of NICHE_CARDS) {
      const demoLinks = links.filter((link) => link.href === demo);

      expect(demoLinks.length, `ссылок на демо ${niche} (${demo})`).toBe(1);

      const [demoLink] = demoLinks;

      expect(demoLink.text, `текст ссылки на демо ${niche}`).toContain(shown(locale, 'nicheDemo'));

      const card = cardOf(html, demoLink, (link) => isForeignDemo(link, demo));

      expect(card, `карточка демо ${niche}`).not.toBeNull();

      const quizHref = `/${locale}/brief?plan=industry&niche=${quizNiche}`;
      const quizLinks = links.filter((link) => link.href === quizHref && inside(link, card!));

      expect(quizLinks.length, `ссылок ${quizHref} в карточке ${niche}`).toBe(1);
    }

    const horecaHref = `/${locale}/brief?plan=industry&niche=horeca`;

    expect(links.filter((link) => link.href === horecaHref).length, `ссылок ${horecaHref}: кофейня и салон`).toBe(2);
  });

  it.each(ROWS)('%s, %s: в карточке салона — название и текст ниши', (design, locale) => {
    const html = renderService(design, locale, 'industry');
    const demoLink = linksOf(html).find((link) => link.href === SALON_DEMO);

    expect(demoLink, `ссылка на ${SALON_DEMO}`).toBeDefined();

    const card = cardOf(html, demoLink!, (link) => isForeignDemo(link, SALON_DEMO));

    expect(card, 'карточка салона').not.toBeNull();

    const cardText = textOf(html.slice(card!.start, card!.end));

    for (const key of ['services.industry.niches.beauty.title', 'services.industry.niches.beauty.text']) {
      expect(cardText, `карточка салона: ${key}`).toContain(shownFrom(locale, key));
    }
  });

  it.each(ROWS)('%s, %s: ссылки на демо ниш открываются в новой вкладке', (design, locale) => {
    const links = linksOf(renderService(design, locale, 'industry'));

    for (const demo of [DENTAL_DEMO, EXPERT_DEMO, COFFEE_DEMO, SALON_DEMO]) {
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

  it.each(ROWS)('%s, %s: на странице лендинга — «Посмотреть пример» на event в новой вкладке', (design, locale) => {
    const links = linksOf(renderService(design, locale, 'landing')).filter((link) => link.href === EVENT_DEMO);

    expect(links.length, `ссылок на ${EVENT_DEMO}`).toBe(1);
    expect(links[0].text).toContain(shown(locale, 'landingExample'));
    expectNewTab(links[0], EVENT_DEMO);
  });

  it.each(NOT_LANDING_ROWS)('%s, %s, %s: на странице другой услуги ссылки на event нет', (design, locale, service) => {
    const html = renderService(design, locale, service);

    expect(html).toContain(`data-service="${service}"`);
    expect(linksOf(html).filter((link) => link.href === EVENT_DEMO)).toEqual([]);
  });
});

describe('«Попробовать» на странице Mini App', () => {
  it.each(ROWS)('%s, %s: четыре ссылки на ботов демо в своих карточках', (design, locale) => {
    const html = renderService(design, locale, 'miniApp');
    const bots = linksOf(html).filter((link) => isBotHref(link.href));

    expect(bots.map((link) => link.href).sort()).toEqual([...BOT_LINKS].sort());

    const texts: Record<string, string> = {
      [DENTAL_TG]: 'tryIt.telegram',
      [DENTAL_MAX]: 'tryIt.max',
      [COFFEE_TG]: 'tryIt.telegram',
      [SALON_TG]: 'tryIt.telegram',
    };

    for (const { app, bots: own } of TRY_IT_CARDS) {
      for (const href of own) {
        const link = bots.find((item) => item.href === href)!;
        const card = cardOf(html, link, (item) => isForeignBot(item, own));

        expect(link.text, `текст ссылки ${href}`).toContain(shown(locale, texts[href]));
        expect(card, `карточка ссылки ${href}`).not.toBeNull();
        expect(textOf(html.slice(card!.start, card!.end)), `название карточки ${href}`).toContain(
          shown(locale, `tryIt.apps.${app}.title`),
        );
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

      for (const { app, bots: own } of TRY_IT_CARDS) {
        const [href] = own;
        const link = links.find((item) => item.href === href);

        expect(link, `ссылка ${href}`).toBeDefined();

        const card = cardOf(html, link!, (item) => isForeignBot(item, own));

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
  it.each(ROWS)('%s, %s: порядок карточек «Попробовать» — клиника, кофейня, салон', (design, locale) => {
    const links = linksOf(renderService(design, locale, 'miniApp'));
    const order = TRY_IT_CARDS.map(({ app, bots: own }) => ({
      app,
      start: Math.min(
        ...links.filter((link) => link.href !== null && own.includes(link.href)).map((link) => link.start),
      ),
    }))
      .filter(({ start }) => Number.isFinite(start))
      .sort((a, b) => a.start - b.start)
      .map(({ app }) => app);

    expect(order).toEqual(['clinic', 'coffee', 'salon']);
  });
});

describe('адреса демо и ботов — в src/lib/consts.ts', () => {
  it.each(URLS)('%s: строка есть только в src/lib/consts.ts, один раз', (url) => {
    const found = Object.fromEntries(
      SCANNED_FILES.map(({ file, source }) => [file, countIn(source, url)] as const).filter(([, count]) => count > 0),
    );

    expect(found).toEqual({ [CONSTS_FILE]: 1 });
  });

  it(`${OLD_LAUNCH_DEMO}: старого адреса примера лендинга в коде сайта нет`, () => {
    const found = Object.fromEntries(
      SCANNED_FILES.map(({ file, source }) => [file, countIn(source, OLD_LAUNCH_DEMO)] as const).filter(
        ([, count]) => count > 0,
      ),
    );

    expect(found).toEqual({});
  });
});

describe('тексты блока дословно', () => {
  it.each(KEYS_RU)('ru: %s равно утвержденному', (key) => {
    expect(messageAt('ru', key)).toBe(T.ru[key]);
  });

  it.each(KEYS_EN)('en: %s равно утвержденному', (key) => {
    expect(messageAt('en', key)).toBe(T.en[key]);
  });

  it.each(ROOT_KEYS_RU)('ru: %s равно утвержденному', (key) => {
    expect(messageFrom('ru', key)).toBe(ROOT_T.ru[key]);
  });

  it.each(ROOT_KEYS_EN)('en: %s равно утвержденному', (key) => {
    expect(messageFrom('en', key)).toBe(ROOT_T.en[key]);
  });
});
