import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { formatMoney, formatRange, planHref } from '@/content/format';
import { industryNicheHref } from '@/content/industry';
import { PRICING_OPTIONS } from '@/content/pricing';
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

type IndustryTexts = {
  included: { items: string[] };
  excluded: { items: string[] };
  niches: Record<string, { title: string }>;
};

type ProviderProps = { locale: string; messages: Messages; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

const MESSAGES: Record<Locale, Messages> = { ru, en: en as Messages };

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

const NICHES = ['clinic', 'expert', 'horeca'] as const;

const INDUSTRY_PLAN = { id: 'industry', slug: 'industry', price: { rub: 59_000, usd: 1_200 }, isFrom: false };

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

const render = (design: DesignName, locale: Locale, props: SectionProps) =>
  renderToStaticMarkup(createElement(Provider, { locale, messages: MESSAGES[locale] }, SECTIONS[design](props)));

const renderService = (design: DesignName, locale: Locale, service: string) =>
  render(design, locale, { section: 'servicePage', service } as unknown as SectionProps);

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

const headingsOf = (html: string) =>
  [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(([, inner]) => textOf(inner));

const hrefOf = (openTag: string) => {
  const match = /\shref="([^"]*)"/.exec(openTag);

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

const linksOf = (html: string) =>
  elementsOf(html)
    .filter((element) => element.tag === 'a')
    .map((element) => {
      const markup = html.slice(element.start, element.end);

      return { ...element, href: hrefOf(markup.slice(0, markup.indexOf('>') + 1)) };
    });

const nicheLinks = (html: string) => linksOf(html).filter((link) => link.href?.includes('niche='));

/** Текст ссылки и всех ее предков, где других ссылок с `niche=` нет: это и есть карточка ниши. */
const cardTexts = (html: string, link: Element) => {
  const others = nicheLinks(html).filter((item) => item.start !== link.start);
  const ancestors = elementsOf(html)
    .filter((element) => element.start <= link.start && element.end >= link.end)
    .filter((element) => !others.some((item) => item.start >= element.start && item.end <= element.end));

  return ancestors.map((element) => textOf(html.slice(element.start, element.end)));
};

const industryTexts = (locale: Locale) =>
  (MESSAGES[locale].services as unknown as Record<string, IndustryTexts | undefined>).industry;

const planName = (locale: Locale, id: string) => {
  const name = (MESSAGES[locale].pricing.plans as Record<string, { name: string } | undefined>)[id]?.name;

  return name === undefined ? undefined : spaced(name);
};

const optionOf = (id: string) => {
  const option = PRICING_OPTIONS.find((item) => item.id === id);

  if (!option) {
    throw new Error(`опции ${id} нет в PRICING_OPTIONS`);
  }

  return option;
};

/** Цена «от» опции, как ее печатает сайт: сумма — `formatMoney` из прайса, обвязка — `pricing.price.from`. */
const optionFromPrice = (locale: Locale, id: string) =>
  MESSAGES[locale].pricing.price.from.replace('{amount}', formatMoney(optionOf(id).price.from, locale));

const optionName = (locale: Locale, id: string) =>
  (MESSAGES[locale].pricing.options as Record<string, { name: string } | undefined>)[id]?.name ?? '';

/** Текст карточки ниши: самый широкий предок ее ссылки, где нет ссылок других ниш. */
const nicheCardText = (html: string, niche: string, locale: Locale) => {
  const link = nicheLinks(html).find((item) => item.href === industryNicheHref(locale, niche));

  return link ? cardTexts(html, link).reduce((widest, text) => (text.length > widest.length ? text : widest), '') : '';
};

/** Строка опции на странице: самый узкий элемент с названием и ценой опции, без названий других опций. */
const optionRowText = (html: string, locale: Locale, id: string) => {
  const name = spaced(optionName(locale, id));
  const price = spaced(formatRange(optionOf(id).price, locale));
  const others = PRICING_OPTIONS.filter((option) => option.id !== id).map((option) =>
    spaced(optionName(locale, option.id)),
  );
  const rows = elementsOf(html)
    .map((element) => textOf(html.slice(element.start, element.end)))
    .filter((text) => text.includes(name) && text.includes(price))
    .sort((a, b) => a.length - b.length);

  return rows.length > 0 && !others.some((other) => rows[0].includes(other)) ? rows[0] : null;
};

const ROWS = DESIGN_NAMES.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

describe('страница отраслевого тарифа во всех направлениях', () => {
  it.each(ROWS)('%s, %s: страница тарифа с названием в h1 и ценой', (design, locale) => {
    const html = renderService(design, locale, 'industry');

    expect(html).not.toBe('');
    expect(html).toContain('data-service="industry"');
    expect(headingsOf(html)[0]).toContain(planName(locale, 'industry'));
    expect(textOf(html)).toContain(spaced(formatMoney(INDUSTRY_PLAN.price, locale)));
  });

  it.each(ROWS)('%s, %s: есть каждый пункт «что входит» и «что не входит»', (design, locale) => {
    const html = renderService(design, locale, 'industry');
    const text = textOf(html);
    const texts = industryTexts(locale);

    expect(html).toContain('data-service="industry"');
    expect(texts, 'тексты services.industry').toBeDefined();

    for (const item of [...texts!.included.items, ...texts!.excluded.items]) {
      expect(text, `пункт «${item}»`).toContain(spaced(item));
    }
  });

  it.each(ROWS)('%s, %s: три карточки отраслей ведут в квиз с предвыбором ниши', (design, locale) => {
    const html = renderService(design, locale, 'industry');
    const links = nicheLinks(html);

    expect(links.length).toBe(3);

    for (const niche of NICHES) {
      const link = links.find((item) => item.href === industryNicheHref(locale, niche));
      const title = spaced(industryTexts(locale)?.niches[niche]?.title ?? '');

      expect(link, `ссылка ниши ${niche}`).toBeDefined();
      expect(title, `название ниши ${niche}`).not.toBe('');
      expect(
        cardTexts(html, link!).some((text) => text.includes(title)),
        `карточка ${niche} с названием «${title}»`,
      ).toBe(true);
    }
  });

  it.each([...DESIGN_NAMES])('%s, ru: срок 7 дней фиксируем в договоре', (design) => {
    const text = textOf(renderService(design, 'ru', 'industry'));

    expect(text).toContain('7 дней');
    expect(text.toLowerCase()).toContain('фиксируем в договоре');
    expect(text.toLowerCase()).not.toContain('прописан');
  });

  it.each(ROWS)('%s, %s: на странице лендинга нет карточек отраслей и пунктов «что не входит»', (design, locale) => {
    const html = renderService(design, locale, 'landing');
    const text = textOf(html);

    expect(html).toContain('data-service="landing"');
    expect(nicheLinks(html)).toEqual([]);

    for (const item of industryTexts(locale)?.excluded.items ?? []) {
      expect(text, `пункт «${item}»`).not.toContain(spaced(item));
    }
  });

  it.each(ROWS)('%s, %s: в таблице тарифов есть отраслевой тариф со ссылкой на его страницу', (design, locale) => {
    const html = render(design, locale, { section: 'pricing' });

    expect(linksOf(html).map((link) => link.href)).toContain(planHref(locale, INDUSTRY_PLAN));
    expect(textOf(html)).toContain(planName(locale, 'industry'));
  });
});

describe('карточка ниши «Эксперт»: цены опций — из прайса', () => {
  it.each([
    ['ru', 'quiz', 'от\u00a020\u00a0000\u00a0₽'],
    ['ru', 'payments', 'от\u00a015\u00a0000\u00a0₽'],
    ['en', 'quiz', 'from $400'],
    ['en', 'payments', 'from $300'],
  ] as const)('%s, %s: цена «от» опции — %s', (locale, id, expected) => {
    expect(optionFromPrice(locale, id)).toBe(expected);
  });

  it.each(ROWS)('%s, %s: в карточке «Эксперт» цены квиза и онлайн-оплаты, без плейсхолдеров', (design, locale) => {
    const text = nicheCardText(renderService(design, locale, 'industry'), 'expert', locale);

    expect(text).toContain(spaced(industryTexts(locale)!.niches.expert.title));
    expect(text).toContain(spaced(optionFromPrice(locale, 'quiz')));
    expect(text).toContain(spaced(optionFromPrice(locale, 'payments')));
    expect(text).not.toContain('{quiz}');
    expect(text).not.toContain('{payments}');
  });

  /** Где в тексте карточки стоит цена каждой опции: цены не перепутаны местами. */
  const OPTION_PRICE_SPOTS: Record<Locale, (quiz: string, payments: string) => string[]> = {
    ru: (quiz, payments) => [`(квиз, ${quiz})`, `(${payments}, плюс комиссия`],
    en: (quiz, payments) => [`quiz for your clients (${quiz})`, `(${payments}, plus the payment service fee`],
  };

  it.each(ROWS)('%s, %s: в карточке «Эксперт» цена квиза — у квиза, цена оплаты — у оплаты', (design, locale) => {
    const text = nicheCardText(renderService(design, locale, 'industry'), 'expert', locale);
    const spots = OPTION_PRICE_SPOTS[locale](optionFromPrice(locale, 'quiz'), optionFromPrice(locale, 'payments'));

    for (const spot of spots) {
      expect(text).toContain(spaced(spot));
    }
  });
});

describe('квиз — опция отраслевого сайта', () => {
  it.each(ROWS)('%s, %s: в опциях страницы есть квиз с названием и ценой', (design, locale) => {
    const html = renderService(design, locale, 'industry');

    expect(optionName(locale, 'quiz')).toBe(locale === 'ru' ? 'Тест для клиентов (квиз)' : 'Customer quiz');
    expect(optionRowText(html, locale, 'quiz')).not.toBeNull();
  });

  it('en: ответ FAQ «Можно ли доработать сайт потом?» называет квиз', () => {
    expect(en.services.industry.faq[3].answer).toContain('quiz');
  });
});
