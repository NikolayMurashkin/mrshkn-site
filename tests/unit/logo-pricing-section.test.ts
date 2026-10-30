import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { formatMoney } from '@/content/format';
import { PRICING_EXTRAS } from '@/content/pricing';
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

type ExtraTexts = { name: string; summary: string };

type Messages = {
  pricing: {
    price: { from: string; month: string; hour: string };
    extras: Record<string, ExtraTexts | undefined>;
  };
};

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

const MESSAGES = { ru, en } as unknown as Record<Locale, Messages>;

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

/** Строки таблицы тарифов по порядку: у логотипа строки в таблице нет. */
const TABLE_PLANS = [
  'industry',
  'landing',
  'industryMiniApp',
  'business',
  'miniApp',
  'store',
  'mvp',
  'threeD',
  'support',
];

/** Цена логотипа «от» — сумма нижнего уровня. */
const LOGO_PRICE = { rub: 30_000, usd: 600 };

/** Строки «Сверх тарифа» без своей страницы: цена с периодом, как раньше. */
const PLAIN_EXTRAS = [
  { id: 'subscription', price: { rub: 180_000, usd: 3_500 }, period: 'month' },
  { id: 'hour', price: { rub: 3_000, usd: 90 }, period: 'hour' },
] as const;

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

const renderPricing = (design: DesignName, locale: Locale) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] },
      SECTIONS[design]({ section: 'pricing' } as unknown as SectionProps),
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

const hrefsOf = (html: string) => [...html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)].map(([, href]) => decode(href));

/** Элемент с `data-testid`: самый первый с таким значением. */
const byTestId = (html: string, testId: string) =>
  elementsOf(html).find((element) => openTagOf(html, element).includes(` data-testid="${testId}"`)) ?? null;

/** Прямые потомки элемента: строки списка, как бы направление их ни сверстало. */
const childrenOf = (html: string, parent: Element) => {
  const inside = elementsOf(html).filter((element) => element.start > parent.start && element.end < parent.end);

  return inside.filter(
    (element) => !inside.some((other) => other !== element && other.start < element.start && other.end > element.end),
  );
};

const planRowIds = (html: string) => [...html.matchAll(/\sdata-testid="plan-([^"]*)"/g)].map(([, id]) => id);

/** Строки блока «Сверх тарифа»: разметка и видимый текст. */
const extraRows = (html: string) => {
  const extras = byTestId(html, 'extras');

  return extras
    ? childrenOf(html, extras).map((row) => {
        const markup = html.slice(row.start, row.end);

        return { markup, text: textOf(markup) };
      })
    : [];
};

const extraTexts = (locale: Locale, id: string) => MESSAGES[locale].pricing.extras[id];

const priceLabel = (locale: Locale, pattern: 'from' | 'month' | 'hour', money: { rub: number; usd: number }) =>
  spaced(MESSAGES[locale].pricing.price[pattern].replace('{amount}', formatMoney(money, locale)));

const ROWS = DESIGN_NAMES.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

describe('логотип в секции цен: в таблице тарифов строки нет, в «Сверх тарифа» — строка со ссылкой', () => {
  it.each(ROWS)(
    '%s, %s: тарифов в таблице по-прежнему девять и без логотипа; в «Сверх тарифа» три строки, у логотипа ссылка на страницу и цена «от»',
    (design, locale) => {
      const html = renderPricing(design, locale);
      const rows = extraRows(html);
      const logoTexts = extraTexts(locale, 'logo');
      const logoRow = rows.find((row) => row.text.includes(spaced(logoTexts?.name ?? '\u0000')));

      expect(planRowIds(html)).toEqual(TABLE_PLANS);
      expect(planRowIds(html)).not.toContain('logo');

      expect([...PRICING_EXTRAS.map((extra) => extra.id)].sort()).toEqual(['hour', 'logo', 'subscription']);
      expect(rows).toHaveLength(PRICING_EXTRAS.length);
      expect(
        rows.map((row) =>
          PRICING_EXTRAS.findIndex((extra) =>
            row.text.includes(spaced(extraTexts(locale, extra.id)?.name ?? '\u0000')),
          ),
        ),
      ).toEqual(PRICING_EXTRAS.map((_, index) => index));

      expect(logoTexts, 'pricing.extras.logo').toEqual({
        name: expect.stringMatching(/\S/),
        summary: expect.stringMatching(/\S/),
      });
      expect(logoRow, 'строка логотипа в «Сверх тарифа»').toBeDefined();
      expect(hrefsOf(logoRow?.markup ?? '')).toContain(`/${locale}/logo?plan=logo`);
      expect(logoRow?.text).toContain(spaced(logoTexts?.summary ?? '\u0000'));
      expect(logoRow?.text).toContain(priceLabel(locale, 'from', LOGO_PRICE));
    },
  );

  it.each(ROWS)('%s, %s: у строк «Dev-подписка» и «Час работы» ссылок нет, цены прежние', (design, locale) => {
    const rows = extraRows(renderPricing(design, locale));

    for (const extra of PLAIN_EXTRAS) {
      const name = spaced(extraTexts(locale, extra.id)?.name ?? '\u0000');
      const row = rows.find((item) => item.text.includes(name));

      expect(row, `строка ${extra.id}`).toBeDefined();
      expect(row?.markup, `строка ${extra.id}: без ссылки`).not.toMatch(/<a\b/);
      expect(row?.text, `строка ${extra.id}: цена`).toContain(priceLabel(locale, extra.period, extra.price));
    }
  });
});
