import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { DESIGN_NAMES } from '@/designs/consts';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { DesignName, SectionProps } from '@/designs/types';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

type Locale = 'ru' | 'en';

type Block = 'prestart' | 'after';

type Card = { title?: unknown; text?: unknown };

type Element = { tag: string; start: number; end: number };

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const LOCALES: readonly Locale[] = ['ru', 'en'];

const MESSAGES = { ru, en } as unknown as Record<Locale, Record<string, unknown>>;

const BLOCKS: readonly Block[] = ['prestart', 'after'];

/** Заголовки блоков — общие для главной и страниц услуг. */
const HEADING_KEYS: Record<Block, string> = {
  prestart: 'process.prestartHeading',
  after: 'process.afterHeading',
};

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

/** У Editorial шкалы нет: «над шкалой» там значит «над шагами». */
const WITHOUT_SCALE: readonly DesignName[] = ['editorial'];

const HOME = 'home';

const COMMON_PRESTART = ['materials', 'prepayment', 'style', 'refusal', 'deadlines', 'pauses', 'silence'];

const COMMON_AFTER = ['speed', 'acceptance', 'warranty', 'repairs', 'notOurFault', 'upkeep'];

/** Карточки по порядку показа: главная и семь услуг; у приложения и 3D — свои наборы. */
const CARD_IDS: Record<string, Record<Block, string[]>> = {
  [HOME]: { prestart: COMMON_PRESTART, after: COMMON_AFTER },
  landing: { prestart: COMMON_PRESTART, after: COMMON_AFTER },
  industry: { prestart: COMMON_PRESTART, after: COMMON_AFTER },
  business: { prestart: COMMON_PRESTART, after: COMMON_AFTER },
  miniApp: {
    prestart: ['kinds', ...COMMON_PRESTART],
    after: ['acceptance', 'warranty', 'repairs', 'notOurFault', 'upkeep'],
  },
  store: { prestart: COMMON_PRESTART, after: COMMON_AFTER },
  mvp: { prestart: COMMON_PRESTART, after: COMMON_AFTER },
  threeD: {
    prestart: ['brief', 'details', 'style', 'refusal', 'deadlines', 'pauses', 'silence'],
    after: ['speed', 'acceptance', 'warranty', 'repairs', 'notOurFault'],
  },
};

const PAGES = Object.keys(CARD_IDS);

const SERVICE_IDS = PAGES.filter((page) => page !== HOME);

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

const valueAt = (root: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object') {
      return (node as Record<string, unknown>)[key];
    }

    return undefined;
  }, root);

const textAt = (locale: Locale, path: string) => {
  const value = valueAt(MESSAGES[locale], path);

  return typeof value === 'string' ? value : '';
};

const blockPath = (page: string, block: Block) => (page === HOME ? `process.${block}` : `services.${page}.${block}`);

const cardsAt = (locale: Locale, page: string, block: Block): Record<string, Card> => {
  const value = valueAt(MESSAGES[locale], blockPath(page, block));

  return value !== null && typeof value === 'object' ? (value as Record<string, Card>) : {};
};

/** Тексты карточек страницы, которые должны быть в разметке: по утвержденному набору id. */
const cardTexts = (locale: Locale, page: string) =>
  BLOCKS.flatMap((block) =>
    CARD_IDS[page][block].map((id) => {
      const card = cardsAt(locale, page, block)[id] ?? {};

      return {
        id: `${block}.${id}`,
        title: typeof card.title === 'string' ? card.title : '',
        text: typeof card.text === 'string' ? card.text : '',
      };
    }),
  );

const nonEmpty = expect.stringMatching(/\S/);

const render = (locale: Locale, node: ReactNode) =>
  renderToStaticMarkup(
    createElement(Provider, { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] }, node),
  );

const renderProcess = (design: DesignName, locale: Locale) =>
  render(locale, SECTIONS[design]({ section: 'process' } as unknown as SectionProps));

const renderServicePage = (design: DesignName, locale: Locale, service: string) =>
  render(locale, SECTIONS[design]({ section: 'servicePage', service } as unknown as SectionProps));

/** Словарь ru, где блок по пути пустой (`{}`): так выглядел бы блок без карточек. */
const ruWithEmptyBlock = (path: string) => {
  const messages = structuredClone(MESSAGES.ru);
  const keys = path.split('.');
  const last = keys.pop() ?? '';

  (valueAt(messages, keys.join('.')) as Record<string, unknown>)[last] = {};

  return messages;
};

const renderRuWith = (messages: Record<string, unknown>, node: ReactNode) =>
  renderToStaticMarkup(createElement(Provider, { locale: 'ru', timeZone: 'Europe/Moscow', messages }, node));

const decode = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

/** Видимый текст: без тегов, неразрывные пробелы остаются как есть. */
const textOf = (html: string) => decode(html.replace(/<[^>]*>/g, ''));

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

const inside = (inner: Element, outer: Element) =>
  inner !== outer && inner.start >= outer.start && inner.end <= outer.end;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Где в разметке стоит заголовок или подпись: начала самых глубоких элементов, весь текст которых — эта строка
 * (вокруг допустимы только знаки без букв и цифр: «// », «01 »). Фраза внутри предложения заголовком не считается.
 */
const labelPositions = (html: string, label: string): number[] => {
  if (label === '') {
    return [];
  }

  const pattern = new RegExp(`^[^\\p{L}\\p{N}]*${escapeRegExp(label)}[^\\p{L}\\p{N}]*$`, 'u');
  const matches = elementsOf(html).filter(
    (element) =>
      element.end - element.start <= label.length * 4 + 2000 &&
      pattern.test(textOf(html.slice(element.start, element.end)).trim()),
  );

  return matches.filter((match) => !matches.some((other) => inside(other, match))).map((match) => match.start);
};

const firstPosition = (html: string, label: string) => Math.min(...labelPositions(html, label));

/** Блок `data-testid="service-process"` целиком; нет блока — пустая строка. */
const serviceProcessBlock = (html: string) => {
  const marker = html.search(/<[^>]*\sdata-testid="service-process"[^>]*>/);

  if (marker === -1) {
    return '';
  }

  const element = elementsOf(html).find((item) => item.start === marker);

  return element ? html.slice(element.start, element.end) : '';
};

/** Есть в тексте разметки: заголовки блоков, заголовки и тексты карточек. */
const expectCardsInText = (text: string, locale: Locale, page: string) => {
  const cards = cardTexts(locale, page);

  for (const block of BLOCKS) {
    const heading = textAt(locale, HEADING_KEYS[block]);

    expect(heading, HEADING_KEYS[block]).toMatch(/\S/);
    expect(text, `заголовок «${heading}»`).toContain(heading);
  }

  for (const card of cards) {
    expect(card.title, `${page}: заголовок карточки ${card.id}`).toMatch(/\S/);
    expect(card.text, `${page}: текст карточки ${card.id}`).toMatch(/\S/);
    expect(text, `${page}: заголовок карточки ${card.id}`).toContain(card.title);
    expect(text, `${page}: текст карточки ${card.id}`).toContain(card.text);
  }
};

/** «Перед стартом» раньше заголовка первого шага, «Гарантия после запуска» позже заголовка последнего. */
const expectOrder = (html: string, locale: Locale, firstStep: string, lastStep: string) => {
  const prestart = labelPositions(html, textAt(locale, HEADING_KEYS.prestart));
  const after = labelPositions(html, textAt(locale, HEADING_KEYS.after));
  const first = labelPositions(html, firstStep);
  const last = labelPositions(html, lastStep);

  expect(prestart.length, 'заголовок «Перед стартом» отдельным элементом').toBeGreaterThan(0);
  expect(after.length, 'заголовок «Гарантия после запуска» отдельным элементом').toBeGreaterThan(0);
  expect(first.length, `заголовок первого шага «${firstStep}»`).toBeGreaterThan(0);
  expect(last.length, `заголовок последнего шага «${lastStep}»`).toBeGreaterThan(0);
  expect(Math.min(...prestart), '«Перед стартом» раньше первого шага').toBeLessThan(Math.min(...first));
  expect(Math.min(...after), '«Гарантия после запуска» позже последнего шага').toBeGreaterThan(Math.max(...last));
};

/** Карточки в тексте разметки идут в порядке `CARD_IDS`: «Перед стартом», затем «Гарантия», внутри — порядок ключей. */
const expectCardsInOrder = (text: string, page: string) => {
  const cards = cardTexts('ru', page);
  const shown = [...cards].sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text)).map((card) => card.id);

  expect(shown, `${page}: порядок карточек`).toEqual(cards.map((card) => card.id));
};

describe('карточки «Перед стартом» и «Гарантия после запуска» в переводах', () => {
  const rows = PAGES.flatMap((page) => BLOCKS.map((block) => [page, block] as const));

  it.each(rows)('ru: %s, %s — карточки по порядку, у каждой заголовок и текст', (page, block) => {
    const cards = cardsAt('ru', page, block);
    const ids = CARD_IDS[page][block];

    expect(Object.keys(cards)).toEqual(ids);
    expect(ids.map((id) => [id, cards[id]?.title, cards[id]?.text])).toEqual(ids.map((id) => [id, nonEmpty, nonEmpty]));
  });

  it.each(rows)('en: %s, %s — те же карточки по порядку, заголовок и текст переведены', (page, block) => {
    const cards = cardsAt('en', page, block);
    const ruCards = cardsAt('ru', page, block);
    const ids = CARD_IDS[page][block];

    expect(Object.keys(cards)).toEqual(ids);
    expect(ids.map((id) => [id, cards[id]?.title, cards[id]?.text])).toEqual(ids.map((id) => [id, nonEmpty, nonEmpty]));

    for (const id of ids) {
      expect(cards[id]?.title, `${id}: заголовок не равен ru`).not.toBe(ruCards[id]?.title);
      expect(cards[id]?.text, `${id}: текст не равен ru`).not.toBe(ruCards[id]?.text);
    }
  });

  it.each(LOCALES)('%s: у поддержки нет ни «Перед стартом», ни «Гарантии после запуска»', (locale) => {
    const support = valueAt(MESSAGES[locale], 'services.support') as Record<string, unknown>;

    expect(Object.keys(support)).not.toContain('prestart');
    expect(Object.keys(support)).not.toContain('after');
  });

  it.each(LOCALES)('%s: заголовки блоков «Перед стартом» и «Гарантия после запуска» не пустые', (locale) => {
    expect(valueAt(MESSAGES[locale], HEADING_KEYS.prestart)).toEqual(nonEmpty);
    expect(valueAt(MESSAGES[locale], HEADING_KEYS.after)).toEqual(nonEmpty);
  });
});

describe('секция «Процесс» главной в каждом направлении рендерит оба блока', () => {
  it.each([...DESIGN_NAMES])(
    '%s, ru: заголовки и карточки обоих блоков; «Перед стартом» до шагов и шкалы, «Гарантия» после шагов',
    (design) => {
      const html = renderProcess(design, 'ru');

      expectCardsInText(textOf(html), 'ru', HOME);
      expectOrder(html, 'ru', ru.process.steps.brief.title, ru.process.steps.launch.title);

      if (!WITHOUT_SCALE.includes(design)) {
        const scale = labelPositions(html, ru.process.scale.style);

        expect(scale.length, `подпись шкалы «${ru.process.scale.style}»`).toBeGreaterThan(0);
        expect(firstPosition(html, textAt('ru', HEADING_KEYS.prestart)), '«Перед стартом» раньше шкалы').toBeLessThan(
          Math.min(...scale),
        );
      }
    },
  );

  it.each([...DESIGN_NAMES])('%s, en: английские заголовки обоих блоков и тексты карточек', (design) => {
    const text = textOf(renderProcess(design, 'en'));

    for (const block of BLOCKS) {
      const heading = textAt('en', HEADING_KEYS[block]);

      expect(heading, HEADING_KEYS[block]).toMatch(/\S/);
      expect(text, `заголовок «${heading}»`).toContain(heading);
    }

    for (const card of cardTexts('en', HOME)) {
      expect(card.text, `текст карточки ${card.id}`).toMatch(/\S/);
      expect(text, `текст карточки ${card.id}`).toContain(card.text);
    }
  });

  it.each([...DESIGN_NAMES])('%s, ru: карточки обоих блоков идут в порядке ключей', (design) => {
    expectCardsInOrder(textOf(renderProcess(design, 'ru')), HOME);
  });

  it.each([...DESIGN_NAMES])(
    '%s, ru: пустой «Перед стартом» не выводится, «Гарантия после запуска» на месте',
    (design) => {
      const html = renderRuWith(
        ruWithEmptyBlock('process.prestart'),
        SECTIONS[design]({ section: 'process' } as unknown as SectionProps),
      );

      expect(labelPositions(html, textAt('ru', HEADING_KEYS.prestart))).toEqual([]);
      expect(labelPositions(html, textAt('ru', HEADING_KEYS.after)).length).toBeGreaterThan(0);
    },
  );
});

describe('страницы услуг в каждом направлении рендерят оба блока в блоке процесса', () => {
  const rows = DESIGN_NAMES.flatMap((design) => SERVICE_IDS.map((service) => [design, service] as const));

  /** Тексты карточек всех страниц, кроме тех, что есть у самой услуги: их на странице услуги быть не должно. */
  const foreignTexts = (service: string) => {
    const own = new Set(cardTexts('ru', service).map((card) => card.text));

    return [
      ...new Set(
        PAGES.filter((page) => page !== service)
          .flatMap((page) => cardTexts('ru', page).map((card) => card.text))
          .filter((text) => text !== '' && !own.has(text)),
      ),
    ];
  };

  it.each(rows)(
    '%s, %s, ru: в блоке процесса заголовки и карточки услуги по порядку, чужих карточек нет',
    (design, service) => {
      const html = renderServicePage(design, 'ru', service);
      const block = serviceProcessBlock(html);
      const steps = (valueAt(ru, `services.${service}.process`) as { title: string }[]).map((step) => step.title);

      expect(block, 'блок data-testid="service-process"').not.toBe('');
      expectCardsInText(textOf(block), 'ru', service);
      expectOrder(block, 'ru', steps[0], steps[steps.length - 1]);

      const text = textOf(html);

      for (const foreign of foreignTexts(service)) {
        expect(text, `карточка другой страницы: «${foreign.slice(0, 60)}…»`).not.toContain(foreign);
      }
    },
  );

  it.each(rows)('%s, %s, ru: обертка service-process одна, карточки в ней в порядке ключей', (design, service) => {
    const html = renderServicePage(design, 'ru', service);

    expect(html.match(/\sdata-testid="service-process"/g) ?? [], 'data-testid="service-process"').toHaveLength(1);
    expectCardsInOrder(textOf(serviceProcessBlock(html)), service);
  });

  it.each([...DESIGN_NAMES])(
    '%s, landing, ru: пустая «Гарантия после запуска» не выводится, «Перед стартом» на месте',
    (design) => {
      const html = renderRuWith(
        ruWithEmptyBlock('services.landing.after'),
        SECTIONS[design]({ section: 'servicePage', service: 'landing' } as unknown as SectionProps),
      );
      const block = serviceProcessBlock(html);

      expect(block, 'блок data-testid="service-process"').not.toBe('');
      expect(labelPositions(block, textAt('ru', HEADING_KEYS.after))).toEqual([]);
      expect(labelPositions(block, textAt('ru', HEADING_KEYS.prestart)).length).toBeGreaterThan(0);
    },
  );

  it.each([...DESIGN_NAMES])('%s, support, ru: заголовков «Перед стартом» и «Гарантия после запуска» нет', (design) => {
    const html = renderServicePage(design, 'ru', 'support');

    expect(html).toContain('data-service="support"');
    expect(labelPositions(html, textAt('ru', HEADING_KEYS.prestart) || 'Перед стартом')).toEqual([]);
    expect(labelPositions(html, textAt('ru', HEADING_KEYS.after) || 'Гарантия после запуска')).toEqual([]);
  });
});
