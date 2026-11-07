// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { createElement, StrictMode, type ComponentType, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CaseDetail } from '@/cms/types';
import { SERVICES } from '@/content/services';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { DesignName, SectionProps } from '@/designs/types';
import { LEGAL_DOCUMENTS } from '@/lib/legal/consts';
import { parseLegalDocument } from '@/lib/legal/parse';
import type { LegalDocumentId, LegalPageProps } from '@/lib/legal/types';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import { APPROVED_GLOSSARY } from './glossary-approved';

/**
 * Подсказки стоят везде, где в секции есть слово словаря: у первого вхождения в подходящем тексте секции, одна кнопка
 * на слово. Подходящий текст — не заголовок, не ссылка и не кнопка, не шапка и не меню, не подпись поля, не вопрос FAQ,
 * не скрытое и не спрятанное от скринридера. Секция — ближайший `section` или `footer`. Квиз, документы, cookie-баннер
 * и отзыв — без подсказок; на английском подсказок нет. Гидратация и двойной рендер `StrictMode` не сбивают правило.
 */

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

type Locale = 'ru' | 'en';

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

type Page = { page: string; props: SectionProps };

type Match = { node: Text; index: number };

const ROOT = join(import.meta.dirname, '..', '..');

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const MESSAGES: Record<Locale, unknown> = { ru, en };

const SECTIONS: [DesignName, (props: SectionProps) => ReactNode][] = [
  ['kinetic', KineticSection],
  ['terminal', TerminalSection],
  ['pop', PopSection],
  ['swiss', SwissSection],
  ['editorial', EditorialSection],
];

const GLOSSARY = Object.entries(APPROVED_GLOSSARY).map(([id, entry]) => ({ id, ...entry }));

/** Что не размечается: ссылки, кнопки (кроме самих слов с подсказкой), заголовки, шапка и меню, подписи, вопросы FAQ. */
const EXCLUDED = [
  'a',
  'button:not([data-term])',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'label',
  'legend',
  'summary',
  'option',
  'header',
  'nav',
  '[aria-hidden="true"]',
  '[role="tooltip"]',
  '[hidden]',
  'script',
  'style',
  'svg',
].join(', ');

const SECTION_SELECTOR = 'section, footer';

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

/** Формы записи целым словом: до и после нет буквы, цифры или дефиса; пробел формы — любой пробел текста. */
const entryPattern = (forms: string[]) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}-])(?:${forms
      .map((form) => form.replace(ESCAPE, '\\$&').replace(/ /g, '\\s'))
      .join('|')})(?![\\p{L}\\p{N}-])`,
    'iu',
  );

/** Кейс из CMS: в задаче два абзаца с «админкой», в первом еще «хостинг»; в решении «админке» и «SEO». */
const CASE_ITEM: CaseDetail = {
  title: 'Кофейня «Зерно»',
  slug: 'zerno',
  kind: 'demo',
  niche: 'horeca',
  design: null,
  demoUrl: null,
  appUrl: null,
  metrics: [],
  cover: { url: '/media/zerno-cover.avif', alt: 'Главная страница кофейни', width: 1600, height: 1000, srcSet: null },
  coverCaption: null,
  task: 'Кофейне нужна админка для меню и хостинг без хлопот.\n\nВторой абзац: админка открывается с телефона.',
  solution: 'Цены меняете сами в админке, а SEO настроили сразу.',
  stack: [],
  lighthouse: null,
};

const CASE_PAGE: Page = { page: 'кейс', props: { section: 'case', caseItem: CASE_ITEM } };

const HOME_PAGES: Page[] = (['hero', 'pricing', 'process', 'audit', 'footer'] as const).map((section) => ({
  page: `главная/${section}`,
  props: { section } as SectionProps,
}));

const SERVICE_PAGES: Page[] = SERVICES.map((service) => ({
  page: `услуга ${service.id}`,
  props: { section: 'servicePage', service: service.id },
}));

const PAGES: Page[] = [...HOME_PAGES, ...SERVICE_PAGES, CASE_PAGE];

const legalPageProps = (id: LegalDocumentId): LegalPageProps => {
  const source = readFileSync(join(ROOT, 'content', 'legal', LEGAL_DOCUMENTS[id].file), 'utf8');
  const blocks = parseLegalDocument(source);
  const title = blocks.find((block) => block.type === 'title');

  return {
    kicker: ru.docs.kicker,
    title: title?.type === 'title' ? title.text : '',
    blocks: blocks.filter((block) => block !== title),
    history: LEGAL_DOCUMENTS[id].history ? { title: ru.docs.history.title, text: ru.docs.history.empty } : undefined,
  };
};

const PAGES_WITHOUT_TERMS: Page[] = [
  { page: 'cookie-баннер', props: { section: 'cookieBanner' } },
  { page: 'политика ПД', props: { section: 'privacyPage' } },
  { page: 'оферта', props: { section: 'legalPage', ...legalPageProps('offer') } },
  { page: 'памятка', props: { section: 'legalPage', ...legalPageProps('howWeWork') } },
  { page: 'квиз', props: { section: 'brief', design: 'kinetic', plan: null, niche: null } },
  { page: 'отзыв', props: { section: 'review', view: 'form', code: 'invite-code', project: 'Сайт кофейни' } },
];

const tree = (locale: Locale, Section: (props: SectionProps) => ReactNode, props: SectionProps) =>
  createElement(
    Provider,
    { locale, timeZone: 'Europe/Moscow', messages: MESSAGES[locale] },
    createElement(Section as ComponentType<SectionProps>, props),
  );

const parse = (html: string) => {
  const container = document.createElement('div');

  container.innerHTML = html;

  return container;
};

const renderPage = (locale: Locale, Section: (props: SectionProps) => ReactNode, props: SectionProps) =>
  parse(renderToStaticMarkup(tree(locale, Section, props)));

const sectionOf = (node: Node, root: HTMLElement): Element =>
  (node instanceof Element ? node : node.parentElement)?.closest(SECTION_SELECTOR) ?? root;

const isEligible = (node: Text) => node.parentElement !== null && node.parentElement.closest(EXCLUDED) === null;

/** Подходящие текстовые узлы в порядке документа, по секциям. */
const eligibleTexts = (root: HTMLElement) => {
  const bySection = new Map<Element, Text[]>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;

    if (isEligible(text)) {
      const section = sectionOf(text, root);

      bySection.set(section, [...(bySection.get(section) ?? []), text]);
    }
  }

  return bySection;
};

const sectionsOf = (root: HTMLElement) => [root, ...root.querySelectorAll(SECTION_SELECTOR)];

const termButtons = (root: HTMLElement, section: Element, id: string) =>
  [...root.querySelectorAll<HTMLButtonElement>(`button[data-term="${id}"]`)].filter(
    (button) => sectionOf(button, root) === section,
  );

const firstMatch = (texts: Text[], pattern: RegExp): Match | null => {
  for (const node of texts) {
    const match = pattern.exec(node.data);

    if (match) {
      return { node, index: match.index };
    }
  }

  return null;
};

const sectionLabel = (section: Element, root: HTMLElement) => {
  if (section === root) {
    return 'вне секции';
  }

  const heading = section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim();

  return heading ? heading.slice(0, 40) : `.${section.getAttribute('class') ?? section.tagName.toLowerCase()}`;
};

/**
 * Где правило «первое вхождение в секции» нарушено: слово есть в подходящем тексте, а кнопки нет, их больше одной
 * или кнопка не на первом вхождении; слова в подходящем тексте нет, а кнопка есть.
 */
const violations = (design: DesignName, page: string, root: HTMLElement) => {
  const texts = eligibleTexts(root);

  return sectionsOf(root).flatMap((section) =>
    GLOSSARY.flatMap(({ id, forms }) => {
      const label = `${design} · ${page} · ${sectionLabel(section, root)} · ${id}`;
      const buttons = termButtons(root, section, id);
      const match = firstMatch(texts.get(section) ?? [], entryPattern(forms));

      if (!match) {
        return buttons.length === 0 ? [] : [`${label}: слова в тексте нет, кнопок ${buttons.length}`];
      }

      const context = match.node.data.slice(Math.max(0, match.index - 20), match.index + 30);

      if (buttons.length !== 1) {
        return [`${label}: кнопок ${buttons.length}, ожидалась 1 у «…${context}…»`];
      }

      return match.node.parentElement?.closest(`button[data-term]`) === buttons[0]
        ? []
        : [`${label}: кнопка не на первом вхождении «…${context}…»`];
    }),
  );
};

const termCounts = (root: HTMLElement) =>
  Object.fromEntries(GLOSSARY.map(({ id }) => [id, root.querySelectorAll(`button[data-term="${id}"]`).length]));

const mockMatchMedia = () =>
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

beforeEach(() => {
  window.matchMedia = mockMatchMedia() as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('подсказки в тексте кейса из CMS', () => {
  it.each(SECTIONS)(
    '21: %s — КОГДА рисуем кейс ТОГДА в «Задаче» и «Решении» у каждого слова одна кнопка на первом вхождении, SEO обернуто',
    (design, Section) => {
      const root = renderPage('ru', Section, CASE_PAGE.props);
      const sectionByHeading = (heading: string) =>
        [...root.querySelectorAll('section')].find(
          (section) => section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() === heading,
        ) as Element;
      const task = sectionByHeading(ru.work.task);
      const solution = sectionByHeading(ru.work.solution);

      expect(task, 'секция «Задача»').toBeDefined();
      expect(solution, 'секция «Решение»').toBeDefined();
      expect(termButtons(root, task, 'admin').map((button) => button.textContent)).toEqual(['админка']);
      expect(termButtons(root, task, 'hosting').map((button) => button.textContent)).toEqual(['хостинг']);
      expect(termButtons(root, solution, 'admin').map((button) => button.textContent)).toEqual(['админке']);
      expect(termButtons(root, solution, 'seo').map((button) => button.textContent)).toEqual(['SEO']);
      expect(violations(design, CASE_PAGE.page, root)).toEqual([]);
    },
  );
});

describe('подсказки на главной, страницах услуг и кейса', () => {
  it.each(SECTIONS)(
    '22: %s — КОГДА рисуем секции ТОГДА в каждой секции у слова словаря одна кнопка на первом вхождении, без слова — ни одной',
    (design, Section) => {
      const found = PAGES.flatMap(({ page, props }) => violations(design, page, renderPage('ru', Section, props)));

      expect(found).toEqual([]);
    },
  );
});

describe('где подсказок нет', () => {
  it.each(SECTIONS)(
    '20: %s — КОГДА рисуем те же секции на en ТОГДА нет ни button[data-term], ни [role="tooltip"]',
    (design, Section) => {
      const found = PAGES.flatMap(({ page, props }) => {
        const root = renderPage('en', Section, props);
        const count = root.querySelectorAll('button[data-term], [role="tooltip"]').length;

        return count === 0 ? [] : [`${design} · ${page}: ${count}`];
      });

      expect(found).toEqual([]);
    },
  );

  it.each(SECTIONS)(
    '23: %s — КОГДА рисуем cookie-баннер, политику, оферту, памятку, квиз и отзыв ТОГДА button[data-term] нет',
    (design, Section) => {
      const found = PAGES_WITHOUT_TERMS.flatMap(({ page, props }) => {
        const pageProps = props.section === 'brief' ? { ...props, design } : props;
        const count = renderPage('ru', Section, pageProps).querySelectorAll('button[data-term]').length;

        return count === 0 ? [] : [`${design} · ${page}: ${count}`];
      });

      expect(found).toEqual([]);
    },
  );
});

describe('гидратация не сбивает «первое в секции»', () => {
  const rows = (['kinetic', 'editorial'] as const).flatMap((design) =>
    [
      { page: 'главная/pricing', props: { section: 'pricing' } as SectionProps },
      { page: 'услуга landing', props: { section: 'servicePage', service: 'landing' } as SectionProps },
    ].map(({ page, props }) => [design, page, props] as const),
  );

  it.each(rows)(
    '24: %s, %s — КОГДА гидрируем SSR в StrictMode ТОГДА без ошибок восстановления и расхождений, кнопок столько же',
    async (design, _page, props) => {
      const Section = SECTIONS.find(([name]) => name === design)?.[1] as (props: SectionProps) => ReactNode;
      const element = createElement(StrictMode, null, tree('ru', Section, props));
      const container = parse(renderToString(element));
      const before = termCounts(container);
      const onRecoverableError = vi.fn();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      document.body.appendChild(container);

      await act(async () => {
        hydrateRoot(container, element, { onRecoverableError });
      });

      const errors = consoleError.mock.calls.map((call) => call.map(String).join(' '));

      expect(
        Object.values(before).reduce((sum, count) => sum + count, 0),
        'кнопок в SSR',
      ).toBeGreaterThan(0);
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errors.filter((message) => /hydrat|did not match|server rendered/i.test(message))).toEqual([]);
      expect(termCounts(container)).toEqual(before);
    },
  );
});
