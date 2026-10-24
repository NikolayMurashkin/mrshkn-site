import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { serviceBriefHref } from '@/content/services';
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

type ListTexts = { note: string; items: string[] };

type ThreeDTexts = {
  terms?: ListTexts;
  needs?: ListTexts;
  model?: string;
  faq?: { question: string; answer: string }[];
};

type Messages = {
  pricing: { tiers?: Record<string, { name: string } | undefined> };
  services: Record<string, ThreeDTexts | undefined>;
};

type ProviderProps = { locale: string; messages: unknown; children?: ReactNode };

type Element = { tag: string; start: number; end: number };

const ROOT = resolve(import.meta.dirname, '../..');

const PUBLIC_DIR = resolve(ROOT, 'public');

const MESSAGES = { ru, en } as unknown as Record<Locale, Messages>;

const SECTIONS: Record<DesignName, (props: SectionProps) => ReactNode> = {
  kinetic: KineticSection,
  terminal: TerminalSection,
  pop: PopSection,
  swiss: SwissSection,
  editorial: EditorialSection,
};

const TIERS = ['block3d', 'landing3d'] as const;

const THREE_D_SERVICE = { id: 'threeD', slug: '3d', options: [] };

const DEMO_LINK: Record<Locale, { href: string; text: string }> = {
  ru: { href: 'https://auto.mrshkn.com/ru', text: 'открыть демо' },
  en: { href: 'https://auto.mrshkn.com/en', text: 'open the demo' },
};

/** Условия для 3D: в одном пункте условия должны стоять все части группы. */
const TERM_GROUPS: Record<Locale, Record<string, (string | RegExp)[]>> = {
  ru: {
    срок: [/(^|\D)4(\D|$)/, /(^|\D)6(\D|$)/, 'недел'],
    геометрия: ['геометри', 'ракурс', 'до сборки сцены'],
    правки: ['три раунда', 'текст', 'цвет', 'подсветк'],
    очередь: ['один 3d-проект в месяц'],
    lighthouse: ['тест скорости google', '90'],
    гарантия: ['год гарантии'],
  },
  en: {
    term: [/(^|\D)4(\D|$)/, /(^|\D)6(\D|$)/, 'week'],
    geometry: ['geometry', 'angle', 'before the scene'],
    revisions: ['three rounds', 'text', 'colo', 'highlight'],
    queue: ['one 3d project a month'],
    lighthouse: [/google|lighthouse/i, '90'],
    warranty: ['one-year warranty'],
  },
};

const NEED_PARTS: Record<Locale, string[]> = {
  ru: ['cad', 'glb', 'фото', 'узл'],
  en: ['cad', 'glb', 'photo', 'part'],
};

const FAQ_TOPICS: Record<Locale, Record<string, RegExp[]>> = {
  ru: {
    'нет модели': [/модел/i],
    'старые телефоны': [/телефон/i],
    'стоимость правок': [/правк/i],
    'Тильда и WordPress': [/Тильд/, /WordPress/],
  },
  en: {
    'no model': [/model/i],
    'old phones': [/phone/i],
    'revision cost': [/revision|change/i],
    'Tilda and WordPress': [/Tilda/, /WordPress/],
  },
};

const MODEL_WORD: Record<Locale, string> = { ru: 'модел', en: 'model' };

const VIDEO_PATTERN = /[^\s"'(),=]+\.(?:mp4|webm)\b/g;

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

const lower = (text: string) => spaced(text).toLowerCase();

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

const linksOf = (html: string) =>
  elementsOf(html)
    .filter((element) => element.tag === 'a')
    .map((element) => {
      const markup = html.slice(element.start, element.end);

      return { ...element, href: attrOf(markup.slice(0, markup.indexOf('>') + 1), 'href'), text: textOf(markup) };
    });

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

/** Адрес картинки из `src`: у `next/image` настоящий файл лежит в параметре `url`. */
const localPath = (address: string) => {
  const url = new URL(address, 'http://x');
  const path = url.pathname === '/_next/image' ? (url.searchParams.get('url') ?? '') : url.pathname;

  return path.startsWith('/') && !address.startsWith('data:') ? decodeURIComponent(path) : null;
};

const inPublic = (path: string | null) => {
  if (path === null) {
    return false;
  }

  const file = resolve(PUBLIC_DIR, `.${path}`);

  return file.startsWith(`${PUBLIC_DIR}/`) && existsSync(file) && statSync(file).isFile();
};

const openTagsOf = (html: string, tag: string) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(([t]) => t);

/** Постеры страницы: атрибут `poster` у видео и картинки `<img>`. */
const postersOf = (html: string) => {
  const posterAttrs = [...html.matchAll(/\sposter="([^"]*)"/g)].map(([, value]) => decode(value));
  const images = openTagsOf(html, 'img').flatMap((tag) => {
    const src = attrOf(tag, 'src');

    return src === null ? [] : [src];
  });

  return { posterAttrs, candidates: [...posterAttrs, ...images].map(localPath).filter((path) => path !== null) };
};

const videosOf = (html: string) => [...html.matchAll(VIDEO_PATTERN)].map(([address]) => decode(address));

const threeDTexts = (locale: Locale) => MESSAGES[locale].services.threeD;

const matchesAll = (item: string, parts: (string | RegExp)[]) =>
  parts.every((part) => (typeof part === 'string' ? lower(item).includes(part) : part.test(spaced(item))));

const ROWS = DESIGN_NAMES.flatMap((design) => LOCALES.map((locale) => [design, locale] as const));

const RU_ROWS = DESIGN_NAMES.map((design) => [design, 'ru'] as const);

const EN_ROWS = DESIGN_NAMES.map((design) => [design, 'en'] as const);

describe('страница услуги «3D-интерактив» во всех направлениях', () => {
  it.each(ROWS)(
    '%s, %s: две карточки вариантов с названием и кнопкой в квиз, общая кнопка услуги',
    (design, locale) => {
      const html = renderService(design, locale, 'threeD');
      const hrefs = linksOf(html).map((link) => link.href);

      expect(html).toContain('data-service="threeD"');

      for (const tierId of TIERS) {
        const name = MESSAGES[locale].pricing.tiers?.[tierId]?.name;

        expect(hrefs, `кнопка варианта ${tierId}`).toContain(tierHref(locale, tierId));
        expect(name, `название варианта ${tierId}`).toEqual(expect.stringMatching(/\S/));
        expect(tierCardText(html, locale, tierId), `карточка варианта ${tierId}`).toContain(spaced(name ?? ''));
      }

      expect(hrefs).toContain(serviceBriefHref(locale, THREE_D_SERVICE));
    },
  );

  it.each(ROWS)('%s, %s: ссылка «Открыть демо» ведет на демо автосервиса в том же языке', (design, locale) => {
    const html = renderService(design, locale, 'threeD');
    const demo = linksOf(html).filter((link) => link.href === DEMO_LINK[locale].href);

    expect(demo.length, `ссылка ${DEMO_LINK[locale].href}`).toBeGreaterThan(0);
    expect(demo.some((link) => link.text.toLowerCase().includes(DEMO_LINK[locale].text))).toBe(true);
  });

  it.each(RU_ROWS)('%s, %s: постер и ролики — файлы сайта, видео не грузится до нажатия', (design, locale) => {
    const html = renderService(design, locale, 'threeD');
    const { posterAttrs, candidates } = postersOf(html);

    expect(html).toContain('data-service="threeD"');
    expect(candidates.filter(inPublic).length, `постер из public/ среди ${candidates.join(', ')}`).toBeGreaterThan(0);

    for (const poster of posterAttrs) {
      expect(inPublic(localPath(poster)), `постер ${poster}`).toBe(true);
    }

    for (const video of videosOf(html)) {
      expect(inPublic(localPath(video)), `ролик ${video}`).toBe(true);
    }

    for (const tag of openTagsOf(html, 'video')) {
      expect(tag, 'видео без автозапуска').not.toMatch(/\sautoplay(=|\s|>|\/)/i);
      expect(attrOf(tag, 'preload'), 'видео не грузится заранее').toBe('none');
    }
  });

  it.each(EN_ROWS)('%s, %s: видео нет, постер — файл сайта', (design, locale) => {
    const html = renderService(design, locale, 'threeD');
    const { candidates } = postersOf(html);

    expect(html).toContain('data-service="threeD"');
    expect(html).not.toContain('<video');
    expect(videosOf(html)).toEqual([]);
    expect(candidates.filter(inPublic).length, `постер из public/ среди ${candidates.join(', ')}`).toBeGreaterThan(0);
  });

  it.each(ROWS)(
    '%s, %s: условия для 3D отрисованы и содержат сроки, утверждение сцены, правки, очередь, Lighthouse и гарантию',
    (design, locale) => {
      const text = textOf(renderService(design, locale, 'threeD'));
      const items = threeDTexts(locale)?.terms?.items ?? [];

      expect(items.length, 'пункты services.threeD.terms').toBeGreaterThan(0);

      for (const item of items) {
        expect(text, `пункт «${item}»`).toContain(spaced(item));
      }

      for (const [group, parts] of Object.entries(TERM_GROUPS[locale])) {
        expect(
          items.some((item) => matchesAll(item, parts)),
          `пункт условий «${group}»`,
        ).toBe(true);
      }
    },
  );

  it.each(ROWS)('%s, %s: что нужно от клиента — CAD, GLB, фото, список узлов', (design, locale) => {
    const text = textOf(renderService(design, locale, 'threeD'));
    const items = threeDTexts(locale)?.needs?.items ?? [];
    const joined = lower(items.join(' '));

    expect(items.length, 'пункты services.threeD.needs').toBeGreaterThan(0);

    for (const item of items) {
      expect(text, `пункт «${item}»`).toContain(spaced(item));
    }

    for (const part of NEED_PARTS[locale]) {
      expect(joined, part).toContain(part);
    }
  });

  it.each(ROWS)('%s, %s: строка про модель с нуля отрисована', (design, locale) => {
    const text = textOf(renderService(design, locale, 'threeD'));
    const model = threeDTexts(locale)?.model ?? '';

    expect(model.trim(), 'services.threeD.model').not.toBe('');
    expect(lower(model)).toContain(MODEL_WORD[locale]);
    expect(text).toContain(spaced(model));
  });

  it.each([...LOCALES])(
    '%s: в FAQ есть вопросы про модель, старые телефоны, цену правок, Тильду и WordPress',
    (locale) => {
      const questions = (threeDTexts(locale)?.faq ?? []).map((item) => spaced(item.question));

      for (const [topic, patterns] of Object.entries(FAQ_TOPICS[locale])) {
        expect(
          questions.some((question) => patterns.every((pattern) => pattern.test(question))),
          `вопрос «${topic}» среди ${JSON.stringify(questions)}`,
        ).toBe(true);
      }
    },
  );

  it.each(ROWS)('%s, %s: на странице лендинга нет демо, вариантов, видео и постера 3D', (design, locale) => {
    const html = renderService(design, locale, 'landing');
    const posters3d = postersOf(renderService(design, 'ru', 'threeD')).candidates;

    expect(html).toContain('data-service="landing"');
    expect(html).not.toContain('auto.mrshkn.com');

    for (const tierId of TIERS) {
      expect(html).not.toContain(`plan=${tierId}`);
    }

    expect(html).not.toContain('<video');
    expect(html).not.toContain(' poster=');
    expect(videosOf(html)).toEqual([]);

    for (const poster of posters3d) {
      expect(html, `постер 3D ${poster}`).not.toContain(poster);
    }
  });

  it.each(['ru', 'en'])('messages/%s.json не упоминает Lens Lab', (locale) => {
    const source = readFileSync(resolve(ROOT, 'messages', `${locale}.json`), 'utf8');

    expect(lower(source)).not.toContain('lens lab');
  });
});
