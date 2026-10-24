import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { ProcessScale } from '@/components/ProcessScale';
import type { ProcessScaleClasses } from '@/components/types';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { SectionProps } from '@/designs/types';
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

type ScaleTexts = {
  style: string;
  day: string;
  pauses: Record<string, string>;
  payments: Record<string, string>;
};

type Messages = { process: { scale: ScaleTexts } };

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

type Segment = { key: string; label: (scale: ScaleTexts) => string; payment?: string };

const LOCALES: readonly Locale[] = ['ru', 'en'];

const MESSAGES = { ru, en } as unknown as Record<Locale, Messages>;

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const dayLabel = (day: number) => (scale: ScaleTexts) => scale.day.replace('{day}', String(day));

const pauseLabel = (pause: string) => (scale: ScaleTexts) => scale.pauses[pause];

/** Отрезки шкалы по порядку: выбор стиля, дни и паузы после каждого; платежи — на стиле, раунде 3 и приемке. */
const SEGMENTS: readonly Segment[] = [
  { key: 'style', label: (scale) => scale.style, payment: 'prepayment' },
  { key: 'day-1', label: dayLabel(1) },
  { key: 'round1', label: pauseLabel('round1') },
  { key: 'day-2', label: dayLabel(2) },
  { key: 'round2', label: pauseLabel('round2') },
  { key: 'day-3', label: dayLabel(3) },
  { key: 'round3', label: pauseLabel('round3'), payment: 'second' },
  { key: 'day-4', label: dayLabel(4) },
  { key: 'acceptance', label: pauseLabel('acceptance'), payment: 'final' },
];

const PAUSE_KEYS = ['round1', 'round2', 'round3', 'acceptance'];

const DAY_KEYS = ['day-1', 'day-2', 'day-3', 'day-4'];

/** Подписи платежей ru — утвержденные строки; en переводит исполнитель, берем из перевода. */
const paymentLabels = (locale: Locale): Record<string, string> =>
  locale === 'ru'
    ? { prepayment: 'Предоплата 30\u00a0%', second: 'Оплата 40\u00a0%', final: 'Последние 30\u00a0%' }
    : MESSAGES.en.process.scale.payments;

/** Terminal: день — «день 01»…«день 04», отрезок выбора — «3 стиля», пауза — символы ░. */
const TERMINAL_DAY: Record<Locale, (day: string) => string> = {
  ru: (day) => `день\u00a0${day}`,
  en: (day) => `day\u00a0${day}`,
};

const TERMINAL_STYLES: Record<Locale, string> = { ru: '3\u00a0стиля', en: '3\u00a0styles' };

const TERMINAL_PAUSE = '░';

/** Pop: у паузы стикер «стоп». */
const POP_STOP: Record<Locale, string> = { ru: 'стоп', en: 'stop' };

const SECTIONS: [string, (props: SectionProps) => ReactNode][] = [
  ['kinetic', KineticSection],
  ['terminal', TerminalSection],
  ['pop', PopSection],
  ['swiss', SwissSection],
];

/** Классы-заглушки: любой ключ — `stub-<ключ>`, у недостающего ключа заглушка тоже есть. */
const STUB_CLASSES = new Proxy({} as ProcessScaleClasses, {
  get: (_target, key) => (typeof key === 'string' ? `stub-${key}` : undefined),
});

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

const render = (locale: Locale, node: ReactNode) =>
  renderToStaticMarkup(
    createElement(Provider, { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] }, node),
  );

const renderScale = (locale: Locale) => render(locale, createElement(ProcessScale, { classes: STUB_CLASSES }));

const renderProcess = (locale: Locale, Section: (props: SectionProps) => ReactNode) =>
  render(locale, Section({ section: 'process' } as unknown as SectionProps));

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

/** Пункты шкалы: `li` верхнего уровня в списке `ol`, где стоит подпись отрезка выбора стиля. */
const scaleItems = (html: string, locale: Locale): string[] => {
  const elements = elementsOf(html);
  const styleLabel = MESSAGES[locale].process.scale.style;
  const track = elements.find(
    (element) => element.tag === 'ol' && textOf(html.slice(element.start, element.end)).includes(styleLabel),
  );

  if (!track) {
    return [];
  }

  const items = elements.filter((element) => element.tag === 'li' && inside(element, track));

  return items
    .filter((item) => !items.some((other) => inside(item, other)))
    .map((item) => html.slice(item.start, item.end));
};

const classAttrs = (html: string) => [...html.matchAll(/\sclass="([^"]*)"/g)].map(([, value]) => value);

const itemByKey = (items: string[], key: string) => items[SEGMENTS.findIndex((segment) => segment.key === key)] ?? '';

/** Общие проверки шкалы: 9 пунктов по порядку с подписями, три платежа на своих отрезках. */
const expectScale = (items: string[], locale: Locale) => {
  const scale = MESSAGES[locale].process.scale;
  const payments = paymentLabels(locale);

  expect(items.length, 'пунктов шкалы').toBe(SEGMENTS.length);

  SEGMENTS.forEach((segment, index) => {
    const text = textOf(items[index] ?? '');

    expect(text, `подпись отрезка ${segment.key}`).toContain(segment.label(scale));

    for (const [payment, label] of Object.entries(payments)) {
      if (payment === segment.payment) {
        expect(text, `платеж ${payment} у отрезка ${segment.key}`).toContain(label);
      } else {
        expect(text, `платеж ${payment} не у отрезка ${segment.key}`).not.toContain(label);
      }
    }
  });
};

describe('шкала «дни и паузы» в строку с классами-заглушками', () => {
  it.each(LOCALES)(
    '%s: 9 пунктов по порядку, подписи отрезков и три платежа на стиле, раунде 3 и приемке',
    (locale) => {
      expectScale(scaleItems(renderScale(locale), locale), locale);
    },
  );

  it.each(LOCALES)('%s: класс «платеж в конце отрезка» — только у приемки', (locale) => {
    const items = scaleItems(renderScale(locale), locale);

    expect(items.length, 'пунктов шкалы').toBe(SEGMENTS.length);

    SEGMENTS.forEach((segment, index) => {
      const classes = classAttrs(items[index] ?? '').flatMap((value) => value.split(/\s+/));

      if (segment.key === 'acceptance') {
        expect(classes, `платеж в конце у ${segment.key}`).toContain('stub-paymentEnd');
      } else {
        expect(classes, `платеж в конце у ${segment.key}`).not.toContain('stub-paymentEnd');
      }
    });
  });

  it.each(LOCALES)('%s: ни один атрибут class не содержит undefined', (locale) => {
    const html = renderScale(locale);

    expect(classAttrs(html).length).toBeGreaterThan(0);
    expect(classAttrs(html).filter((value) => value.includes('undefined'))).toEqual([]);
  });
});

describe('шкала в секции «Процесс» направлений', () => {
  const rows = SECTIONS.flatMap(([design, Section]) => LOCALES.map((locale) => [design, locale, Section] as const));

  it.each(rows)(
    '%s, %s: шкала из 9 пунктов с подписями и тремя платежами, class без undefined',
    (_d, locale, Section) => {
      const html = renderProcess(locale, Section);

      expectScale(scaleItems(html, locale), locale);
      expect(classAttrs(html).filter((value) => value.includes('undefined'))).toEqual([]);
    },
  );

  it.each(LOCALES)('terminal, %s: дни «день 01»…«день 04», выбор стиля «3 стиля», в паузах ░', (locale) => {
    const items = scaleItems(renderProcess(locale, TerminalSection), locale);

    expect(items.length, 'пунктов шкалы').toBe(SEGMENTS.length);

    DAY_KEYS.forEach((key, index) => {
      expect(textOf(itemByKey(items, key)), key).toContain(TERMINAL_DAY[locale](String(index + 1).padStart(2, '0')));
    });

    expect(textOf(itemByKey(items, 'style')), 'style').toContain(TERMINAL_STYLES[locale]);

    for (const key of PAUSE_KEYS) {
      expect(textOf(itemByKey(items, key)), key).toContain(TERMINAL_PAUSE);
    }
  });

  it.each(LOCALES)('pop, %s: в паузах стикер «стоп»', (locale) => {
    const items = scaleItems(renderProcess(locale, PopSection), locale);

    expect(items.length, 'пунктов шкалы').toBe(SEGMENTS.length);

    for (const key of PAUSE_KEYS) {
      expect(textOf(itemByKey(items, key)), key).toContain(POP_STOP[locale]);
    }
  });
});
