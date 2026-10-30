// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SERVICES } from '@/content/services';
import { DESIGN_NAMES, NAV_ITEMS } from '@/designs/consts';
import { navHref } from '@/designs/nav';
import { GOALS } from '@/lib/analytics/consts';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { TELEGRAM_URL } from '@/lib/consts';
import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';

/**
 * Мобильное меню шапки всех пяти направлений: бургер на ширине, где меню шапки пропадает, открывает панель под
 * шапкой — пункты меню, язык, тема, Telegram; CTA остается в шапке. Закрытие — крестик, Esc, пункт меню,
 * расширение окна за порог направления; фокус держится в круге «крестик + панель» и возвращается на бургер;
 * прокрутка страницы под открытой панелью заблокирована.
 *
 * jsdom не считает CSS и раскладку → ширина окна — заглушка `matchMedia` от `innerWidth`, Tab — помощник
 * `pressTab`, повторяющий браузер: если обработчик не отменил `keydown`, фокус идет на следующий фокусируемый
 * элемент документа по порядку DOM. Меню и переключатели шапки, скрытые CSS на телефоне, в jsdom фокусируемы →
 * круг фокуса реализация держит сама, не полагаясь на CSS.
 */

const route = vi.hoisted(() => ({ pathname: '/ru', locale: 'ru' }));

const spies = vi.hoisted(() => ({ setTheme: vi.fn(), reachGoal: vi.fn() }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => route.pathname,
  useParams: () => ({ locale: route.locale }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', resolvedTheme: 'dark', setTheme: spies.setTheme }),
}));

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('@/components/Analytics/use-consent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/Analytics/use-consent')>()),
  useGoal: () => spies.reachGoal,
}));

type Locale = 'ru' | 'en';

type SectionId = 'services' | 'work' | 'process' | 'contacts';

/** Прямоугольник секции в окне: `[top, bottom]`. */
type Layout = Record<SectionId, [number, number]>;

type MediaListener = ((event: MediaQueryListEvent) => void) | { handleEvent: (event: MediaQueryListEvent) => void };

type MediaEntry = {
  media: string;
  list: MediaQueryList;
  listeners: Set<MediaListener>;
  matches: boolean;
};

const MESSAGES = { ru: ruMessages, en: enMessages } as const;

/**
 * Порог направления — ширина, до которой включительно меню шапки пропадает и стоит бургер. Числами, не импортом
 * констант направлений: тест ловит и неверную константу.
 */
const THRESHOLD: Record<string, number> = { kinetic: 1080, terminal: 1080, pop: 1080, swiss: 720, editorial: 720 };

/** Ширина телефона, с которой начинается каждый сценарий. */
const PHONE_WIDTH = 390;

/** Ширина окна jsdom по умолчанию — возвращается после сценария. */
const JSDOM_WIDTH = 1024;

const VIEWPORT_HEIGHT = 900;

const PAGE_HEIGHT = 10_000;

const NAMES: Record<Locale, { open: string; close: string }> = {
  ru: { open: 'Открыть меню', close: 'Закрыть меню' },
  en: { open: 'Open menu', close: 'Close menu' },
};

const EXPECTED_LINKS: Record<Locale, { href: string; text: string }[]> = {
  ru: [
    { href: '/ru#services', text: 'Услуги' },
    { href: '/ru/work', text: 'Кейсы' },
    { href: '/ru#process', text: 'Процесс' },
    { href: '/ru#contacts', text: 'Контакты' },
  ],
  en: [
    { href: '/en#services', text: 'Services' },
    { href: '/en/work', text: 'Work' },
    { href: '/en#process', text: 'Process' },
    { href: '/en#contacts', text: 'Contact' },
  ],
};

/** «Услуги и цены» занимает линию под шапкой. */
const SERVICES_UNDER_HEADER: Layout = {
  services: [-300, 1500],
  work: [1500, 2500],
  process: [2500, 4500],
  contacts: [4500, 5000],
};

const SERVICE_SLUG = SERVICES[0].slug;

const HEADER_CTA_DESIGNS: readonly string[] = ['kinetic', 'terminal', 'pop'];

/** Инлайн-стили прокрутки до открытия меню: тест ставит их пустыми до рендера. */
const UNLOCKED_SCROLL = {
  htmlOverflow: '',
  bodyOverflow: '',
  htmlPosition: '',
  bodyPosition: '',
  htmlScrollbarGutter: '',
};

const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';

const WIDTH_CLAUSE = /^\(\s*(max|min)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)$/i;

const MEDIA_TYPE = /^(only\s+)?(all|screen)$/i;

const HEADERS = import.meta.glob('../../src/designs/*/Header.tsx');

const mediaEntries: MediaEntry[] = [];

/** Отменен ли реализацией каждый клик, дошедший до `window` (jsdom не переходит по адресу → тест отменяет сам). */
const clicks: { prevented: boolean[] } = { prevented: [] };

const recordClick = (event: Event) => {
  clicks.prevented.push(event.defaultPrevented);
  event.preventDefault();
};

const queryMatches = (media: string, width: number) =>
  media.split(/\s+and\s+/i).every((raw) => {
    const clause = raw.trim();

    if (MEDIA_TYPE.test(clause)) {
      return true;
    }

    const match = WIDTH_CLAUSE.exec(clause);

    if (!match) {
      return false;
    }

    const value = Number(match[2]);

    return match[1].toLowerCase() === 'max' ? width <= value : width >= value;
  });

const matchMedia = (media: string): MediaQueryList => {
  const listeners = new Set<MediaListener>();
  const list = {
    media,
    get matches() {
      return queryMatches(media, window.innerWidth);
    },
    onchange: null as ((event: MediaQueryListEvent) => void) | null,
    addEventListener: (type: string, listener: MediaListener) => {
      if (type === 'change') {
        listeners.add(listener);
      }
    },
    removeEventListener: (type: string, listener: MediaListener) => {
      if (type === 'change') {
        listeners.delete(listener);
      }
    },
    addListener: (listener: MediaListener) => listeners.add(listener),
    removeListener: (listener: MediaListener) => listeners.delete(listener),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;

  mediaEntries.push({ media, list, listeners, matches: queryMatches(media, window.innerWidth) });

  return list;
};

const setInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
};

const setScroll = (scrollY: number, scrollHeight: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: scrollY });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: scrollHeight });
};

/** Два кадра отрисовки: эффекты и пересчеты в `requestAnimationFrame` успевают отработать. */
const settle = () =>
  act(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      }),
  );

/** Меняет ширину окна: `resize` в `window` и `change` тем медиазапросам, у которых поменялся `matches`. */
const setWidth = async (width: number) => {
  act(() => {
    setInnerWidth(width);
    window.dispatchEvent(new Event('resize'));

    for (const entry of mediaEntries) {
      const matches = queryMatches(entry.media, width);

      if (matches === entry.matches) {
        continue;
      }

      entry.matches = matches;

      const event = Object.assign(new Event('change'), { matches, media: entry.media }) as MediaQueryListEvent;

      entry.list.onchange?.call(entry.list, event);

      for (const listener of [...entry.listeners]) {
        if (typeof listener === 'function') {
          listener(event);
        } else {
          listener.handleEvent(event);
        }
      }
    }
  });
  await settle();
};

const setLayout = (layout: Layout) => {
  for (const [id, [top, bottom]] of Object.entries(layout)) {
    let section = document.getElementById(id);

    if (!section) {
      section = document.createElement('section');
      section.id = id;
      section.dataset.testSection = '';
      document.body.append(section);
    }

    section.getBoundingClientRect = () =>
      ({
        top,
        bottom,
        left: 0,
        right: 1440,
        width: 1440,
        height: bottom - top,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
  }
};

const loadHeader = async (design: string): Promise<ComponentType<{ hasCases: boolean }>> => {
  const name = `${design[0].toUpperCase()}${design.slice(1)}Header`;
  const load = HEADERS[`../../src/designs/${design}/Header.tsx`];
  const designModule = (load ? await load() : {}) as Record<string, unknown>;

  expect(designModule[name], `у направления ${design} нет ${name}`).toBeTypeOf('function');

  return designModule[name] as ComponentType<{ hasCases: boolean }>;
};

/** Шапка между двумя внешними ссылками: утечку фокуса из круга ловят они и пункты самой шапки. */
const renderHeader = async (
  design: string,
  { locale = 'ru', hasCases = true }: { locale?: Locale; hasCases?: boolean } = {},
) => {
  const Header = await loadHeader(design);

  /** Новый элемент на каждый рендер: с тем же объектом React пропускает перерисовку и шапка не видит новый адрес. */
  const makeTree = () => (
    <NextIntlClientProvider
      locale={locale}
      timeZone="Europe/Moscow"
      messages={MESSAGES[locale]}
    >
      <a href="#before">before</a>
      <Header hasCases={hasCases} />
      <a href="#after">after</a>
    </NextIntlClientProvider>
  );
  const view = render(makeTree());

  await settle();

  /** Тот же layout после перехода: шапка не пересоздается, меняется только адрес (`route.pathname`). */
  const navigate = async (pathname: string) => {
    route.pathname = pathname;
    view.rerender(makeTree());
    await settle();
  };

  return Object.assign(view, { navigate });
};

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Текст элемента без декоративных частей (`aria-hidden`): номер или стрелка рядом с подписью не в счет. */
const readableText = (element: Element) => {
  const clone = element.cloneNode(true) as Element;

  clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());

  return normalize(clone.textContent ?? '');
};

const describeElement = (element: Element | null) =>
  element
    ? `${element.tagName.toLowerCase()} ${element.getAttribute('href') ?? element.getAttribute('aria-label') ?? normalize(element.textContent ?? '')}`
    : 'null';

/** Бургер — единственная кнопка шапки с `aria-controls` и `aria-expanded`. */
const getBurger = () => {
  const found = [...document.querySelectorAll<HTMLButtonElement>('header button[aria-controls][aria-expanded]')];

  expect(found, 'в шапке ровно одна кнопка меню с aria-controls и aria-expanded').toHaveLength(1);

  return found[0];
};

const burgerName = (burger: HTMLElement) =>
  burger.hasAttribute('aria-label') ? burger.getAttribute('aria-label') : (burger.textContent?.trim() ?? '');

const panelOf = (burger: HTMLElement) => document.getElementById(burger.getAttribute('aria-controls') ?? '');

const isUnderHiddenOrInert = (element: Element) => element.closest('[hidden], [inert]') !== null;

const expectOpen = () => {
  const burger = getBurger();

  expect(burger.getAttribute('aria-expanded'), 'бургер сообщает, что меню открыто').toBe('true');

  const panel = panelOf(burger);

  expect(panel, 'панель по aria-controls бургера').not.toBeNull();
  expect(isUnderHiddenOrInert(panel as HTMLElement), 'открытая панель без hidden и inert').toBe(false);

  return panel as HTMLElement;
};

const expectClosed = () => {
  const burger = getBurger();

  expect(burger.getAttribute('aria-expanded'), 'бургер сообщает, что меню закрыто').toBe('false');

  const panel = panelOf(burger);

  expect(panel === null || isUnderHiddenOrInert(panel), 'закрытой панели нет или она под hidden / inert').toBe(true);
};

const scrollStyles = () => ({
  htmlOverflow: document.documentElement.style.overflow,
  bodyOverflow: document.body.style.overflow,
  htmlPosition: document.documentElement.style.position,
  bodyPosition: document.body.style.position,
  htmlScrollbarGutter: document.documentElement.style.scrollbarGutter,
});

const isScrollLocked = () =>
  document.documentElement.style.overflow === 'hidden' ||
  document.body.style.overflow === 'hidden' ||
  document.body.style.position === 'fixed';

const resetScrollStyles = () => {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.documentElement.style.position = '';
  document.body.style.position = '';
  document.documentElement.style.scrollbarGutter = '';
};

const clickBurger = async () => {
  fireEvent.click(getBurger());
  await settle();
};

const openMenu = async () => {
  await clickBurger();

  return expectOpen();
};

const pressEscape = async () => {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape', code: 'Escape' });
  await settle();
};

const hasInlineDisplayNone = (element: HTMLElement) => {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (node.style.display === 'none') {
      return true;
    }
  }

  return false;
};

const isFocusable = (element: HTMLElement) =>
  !element.matches(':disabled') &&
  element.getAttribute('tabindex') !== '-1' &&
  element.tabIndex >= 0 &&
  !(element instanceof HTMLInputElement && element.type === 'hidden') &&
  !isUnderHiddenOrInert(element) &&
  !hasInlineDisplayNone(element);

const focusables = () => [...document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(isFocusable);

/**
 * Tab как в браузере: `keydown` на элементе в фокусе; не отменен — фокус на следующий (с Shift — предыдущий)
 * фокусируемый элемент документа по порядку DOM, по кругу документа.
 */
const pressTab = async (shift = false) => {
  const from = document.activeElement ?? document.body;
  const proceed = fireEvent.keyDown(from, { key: 'Tab', code: 'Tab', shiftKey: shift });

  if (proceed) {
    const list = focusables();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const step = shift ? -1 : 1;
    const fallback = shift ? list[list.length - 1] : list[0];
    const next = index === -1 ? fallback : list[(index + step + list.length) % list.length];

    act(() => {
      next?.focus();
    });
  }

  await settle();
};

/**
 * Ссылки пунктов меню внутри панели: адрес — один из `navHref` пунктов `NAV_ITEMS`. Ссылки языка не в счет:
 * на `/ru/work` ссылка «RU» ведет туда же, куда пункт «Кейсы».
 */
const panelNavLinks = (panel: HTMLElement, locale: Locale) => {
  const hrefs = new Set(NAV_ITEMS.map((item) => navHref(locale, item)));

  return [...panel.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
    (link) => hrefs.has(link.getAttribute('href') ?? '') && !link.dataset.testid?.startsWith('locale-'),
  );
};

const linksOf = (links: HTMLAnchorElement[]) =>
  links.map((link) => ({ href: link.getAttribute('href'), text: readableText(link) }));

const currentOf = (links: HTMLAnchorElement[]) =>
  links.map((link) => ({ href: link.getAttribute('href'), current: link.getAttribute('aria-current') }));

/** Пункты меню самой шапки, не панели. */
const headerNavLinks = (panel: HTMLElement) =>
  [...document.querySelectorAll<HTMLAnchorElement>('header nav a')].filter((link) => !panel.contains(link));

const countOf = (selector: string) => document.querySelectorAll(selector).length;

const telegramLinks = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLAnchorElement>('a[href]')].filter((link) => link.getAttribute('href') === TELEGRAM_URL);

/**
 * Порядок фокуса по кругу «крестик, затем фокусируемые панели по порядку DOM»: после каждого нажатия фокус внутри,
 * на следующем (Shift — на предыдущем) элементе круга с переходом через край, все посещены.
 */
const expectFocusCycle = async (shift: boolean) => {
  const panel = await openMenu();
  const burger = getBurger();
  const panelItems = focusables().filter((element) => panel.contains(element) && element !== burger);
  const order: Element[] = [burger, ...panelItems];
  const circle = new Set<Element>(order);
  const visited = new Set<Element>();
  const escaped: string[] = [];
  const wrongStep: string[] = [];
  const onFocusIn = (event: FocusEvent) => visited.add(event.target as Element);

  expect(panelItems.length, 'в панели есть фокусируемые элементы').toBeGreaterThan(0);

  document.addEventListener('focusin', onFocusIn);

  try {
    for (let press = 0; press < 2 * circle.size + 2; press += 1) {
      const from = document.activeElement ? order.indexOf(document.activeElement) : -1;

      await pressTab(shift);

      const active = document.activeElement;

      if (active && circle.has(active)) {
        visited.add(active);
      } else {
        escaped.push(`нажатие ${press + 1}: ${describeElement(active)}`);
      }

      if (from !== -1) {
        const expected = order[(from + (shift ? -1 : 1) + order.length) % order.length];

        if (active !== expected) {
          wrongStep.push(
            `нажатие ${press + 1}: ждали ${describeElement(expected)}, фокус на ${describeElement(active)}`,
          );
        }
      }
    }
  } finally {
    document.removeEventListener('focusin', onFocusIn);
  }

  expect(escaped, 'фокус не выходит из круга «крестик + панель»').toEqual([]);
  expect(wrongStep, shift ? 'Shift+Tab — на предыдущий элемент круга' : 'Tab — на следующий элемент круга').toEqual([]);
  expect(
    panelItems.filter((element) => !visited.has(element)).map(describeElement),
    'каждый фокусируемый элемент панели посещен',
  ).toEqual([]);
};

class SilentIntersectionObserver {
  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  route.pathname = '/ru';
  route.locale = 'ru';
  spies.setTheme.mockClear();
  spies.reachGoal.mockClear();
  clicks.prevented = [];
  mediaEntries.length = 0;
  vi.stubGlobal('IntersectionObserver', SilentIntersectionObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 0),
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: VIEWPORT_HEIGHT });
  setInnerWidth(PHONE_WIDTH);
  setScroll(0, PAGE_HEIGHT);
  resetScrollStyles();
  window.addEventListener('click', recordClick);
});

afterEach(() => {
  cleanup();
  window.removeEventListener('click', recordClick);
  document.querySelectorAll('[data-test-section]').forEach((section) => section.remove());
  Reflect.deleteProperty(window, 'matchMedia');
  setInnerWidth(JSDOM_WIDTH);
  resetScrollStyles();
  vi.unstubAllGlobals();
});

describe('поведение мобильного меню', () => {
  it.each(DESIGN_NAMES)(
    'S1 %s, ru: на телефоне бургер «Открыть меню» открывает панель, имя — «Закрыть меню», прокрутка заблокирована',
    async (design) => {
      await renderHeader(design);

      expect(burgerName(getBurger())).toBe(NAMES.ru.open);
      expectClosed();
      expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);

      await clickBurger();

      expectOpen();
      expect(burgerName(getBurger())).toBe(NAMES.ru.close);
      expect(isScrollLocked(), 'прокрутка под панелью заблокирована').toBe(true);
    },
  );

  it.each(DESIGN_NAMES)('S1-en %s, en: имена бургера «Open menu» → «Close menu»', async (design) => {
    route.pathname = '/en';
    route.locale = 'en';
    await renderHeader(design, { locale: 'en' });

    expect(burgerName(getBurger())).toBe(NAMES.en.open);
    expectClosed();

    await clickBurger();

    expectOpen();
    expect(burgerName(getBurger())).toBe(NAMES.en.close);
  });

  it.each(DESIGN_NAMES)('S2 %s: крестик закрывает панель, фокус на бургере, прокрутка снята', async (design) => {
    await renderHeader(design);
    await openMenu();
    await clickBurger();

    expectClosed();
    expect(burgerName(getBurger())).toBe(NAMES.ru.open);
    expect(document.activeElement, 'фокус вернулся на бургер').toBe(getBurger());
    expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);
  });

  it.each(DESIGN_NAMES)('S3 %s: Esc закрывает панель, фокус на бургере, прокрутка снята', async (design) => {
    await renderHeader(design);
    await openMenu();
    await pressEscape();

    expectClosed();
    expect(document.activeElement, 'фокус вернулся на бургер').toBe(getBurger());
    expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);
  });

  it.each(DESIGN_NAMES)(
    'S4 %s: клик по пункту «Услуги» закрывает панель и не отменяет переход по якорю',
    async (design) => {
      await renderHeader(design);

      const panel = await openMenu();
      const services = panelNavLinks(panel, 'ru').find((link) => link.getAttribute('href') === '/ru#services');

      expect(services, 'в панели есть пункт «Услуги» со ссылкой /ru#services').toBeDefined();
      expect(readableText(services as HTMLAnchorElement)).toBe('Услуги');

      clicks.prevented = [];
      fireEvent.click(services as HTMLAnchorElement);
      await settle();

      expectClosed();
      expect(document.activeElement, 'фокус вернулся на бургер').toBe(getBurger());
      expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);
      expect(clicks.prevented, 'переход к секции — родной якорь, клик не отменен').toEqual([false]);
    },
  );

  it.each(DESIGN_NAMES)(
    'S5 %s: на пороге направления панель открыта, на пиксель шире — закрыта, прокрутка снята',
    async (design) => {
      await renderHeader(design);
      await openMenu();
      await setWidth(THRESHOLD[design]);

      expectOpen();

      await setWidth(THRESHOLD[design] + 1);

      expectClosed();
      expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);
    },
  );

  it.each(DESIGN_NAMES)('S6 %s: при открытии фокус — внутри панели', async (design) => {
    await renderHeader(design);

    const panel = await openMenu();

    expect(
      panel.contains(document.activeElement),
      `фокус в панели, а не на ${describeElement(document.activeElement)}`,
    ).toBe(true);
  });

  it.each(DESIGN_NAMES)('S7 %s: Tab ходит по кругу «крестик + панель»', async (design) => {
    await renderHeader(design);
    await expectFocusCycle(false);
  });

  it.each(DESIGN_NAMES)('S8 %s: Shift+Tab ходит по кругу «крестик + панель»', async (design) => {
    await renderHeader(design);
    await expectFocusCycle(true);
  });

  it.each(DESIGN_NAMES)('S9 %s: шапка снята с открытой панелью — прокрутка снята', async (design) => {
    const view = await renderHeader(design);

    await openMenu();

    expect(isScrollLocked(), 'прокрутка под панелью заблокирована').toBe(true);

    view.unmount();

    expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);
  });

  it.each(DESIGN_NAMES)(
    'S11 %s: переход на другую страницу мимо пунктов панели (знак, CTA, «Назад») закрывает меню и снимает прокрутку',
    async (design) => {
      route.pathname = `/ru/${SERVICE_SLUG}`;

      const view = await renderHeader(design);

      await openMenu();
      await view.navigate('/ru');

      expectClosed();
      expect(document.activeElement, 'при переходе фокус не возвращается на бургер').not.toBe(getBurger());
      expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);
    },
  );

  it.each(DESIGN_NAMES)(
    'S12 %s: знак и CTA шапки вне панели закрывают меню и на том же адресе (знак на главной), фокус не на бургере',
    async (design) => {
      await renderHeader(design);

      const header = getBurger().closest('header') as HTMLElement;
      const outsidePanel = (href: string) =>
        [...header.querySelectorAll<HTMLAnchorElement>('a[href]')].find(
          (link) =>
            link.getAttribute('href') === href && !link.closest(`#${getBurger().getAttribute('aria-controls')}`),
        );

      /** CTA в шапке — только у Kinetic, Terminal и Pop («Цель» B222); у Swiss и Editorial ее нет. */
      const links = [['знак', '/ru'], ...(HEADER_CTA_DESIGNS.includes(design) ? [['CTA', `/ru${BRIEF_HREF}`]] : [])];

      for (const [what, href] of links) {
        await openMenu();

        const link = outsidePanel(href);

        expect(link, `${what}: в шапке вне панели есть ссылка ${href}`).toBeDefined();

        fireEvent.click(link as HTMLAnchorElement);
        await settle();

        expectClosed();
        expect(document.activeElement, `${what}: фокус не возвращается на бургер`).not.toBe(getBurger());
        expect(scrollStyles()).toEqual(UNLOCKED_SCROLL);
      }
    },
  );

  it.each(DESIGN_NAMES)(
    'S10 %s: после закрытия Esc панель открывается снова — заблокирована, фокус в панели',
    async (design) => {
      await renderHeader(design);
      await openMenu();
      await pressEscape();

      expectClosed();

      const panel = await openMenu();

      expect(isScrollLocked(), 'прокрутка под панелью заблокирована').toBe(true);
      expect(panel.contains(document.activeElement), 'фокус в панели').toBe(true);
    },
  );
});

describe('состав мобильной панели', () => {
  it.each(DESIGN_NAMES.flatMap((design) => (['ru', 'en'] as const).map((locale) => [design, locale] as const)))(
    'C1 %s, %s: пункты панели — Услуги, Кейсы, Процесс, Контакты со ссылками navHref',
    async (design, locale) => {
      route.pathname = `/${locale}`;
      route.locale = locale;
      await renderHeader(design, { locale });

      expect(linksOf(panelNavLinks(await openMenu(), locale))).toEqual(EXPECTED_LINKS[locale]);
    },
  );

  it.each(DESIGN_NAMES)('C2 %s: без кейсов — Услуги, Процесс, Контакты, ссылки на /ru/work нет', async (design) => {
    await renderHeader(design, { hasCases: false });

    const panel = await openMenu();

    expect(panelNavLinks(panel, 'ru').map((link) => link.getAttribute('href'))).toEqual([
      '/ru#services',
      '/ru#process',
      '/ru#contacts',
    ]);
    expect([...panel.querySelectorAll('a[href]')].filter((link) => link.getAttribute('href') === '/ru/work')).toEqual(
      [],
    );
  });

  it.each(
    DESIGN_NAMES.flatMap((design) => [
      [design, 'главная', '/ru', { ru: '/ru', en: '/en' }] as const,
      [
        design,
        'страница услуги',
        `/ru/${SERVICE_SLUG}`,
        { ru: `/ru/${SERVICE_SLUG}`, en: `/en/${SERVICE_SLUG}` },
      ] as const,
    ]),
  )('C3 %s, %s: язык в панели ведет на ту же страницу', async (design, _page, pathname, expected) => {
    route.pathname = pathname;
    await renderHeader(design);

    const panel = await openMenu();

    expect({
      ru: panel.querySelector('[data-testid="locale-ru"]')?.getAttribute('href'),
      en: panel.querySelector('[data-testid="locale-en"]')?.getAttribute('href'),
    }).toEqual(expected);
  });

  it.each(DESIGN_NAMES)('C4 %s: тема в панели — «Сменить тему», клик меняет тему, панель открыта', async (design) => {
    await renderHeader(design);

    const toggle = (await openMenu()).querySelector<HTMLElement>('[data-testid="theme-toggle"]');

    expect(toggle, 'в панели есть переключатель темы').not.toBeNull();
    expect(toggle?.getAttribute('aria-label')).toBe('Сменить тему');

    fireEvent.click(toggle as HTMLElement);
    await settle();

    expect(spies.setTheme.mock.calls).toEqual([['light']]);
    expectOpen();
  });

  it.each(DESIGN_NAMES.flatMap((design) => (['ru', 'en'] as const).map((locale) => [design, locale] as const)))(
    'C5 %s, %s: Telegram в панели — адрес студии в новой вкладке, клик — цель telegramClick',
    async (design, locale) => {
      route.pathname = `/${locale}`;
      route.locale = locale;
      await renderHeader(design, { locale });

      const links = telegramLinks(await openMenu());

      expect(links, 'в панели одна ссылка на Telegram студии').toHaveLength(1);

      const [link] = links;

      expect({
        target: link.getAttribute('target'),
        noopener: (link.getAttribute('rel') ?? '').split(/\s+/).includes('noopener'),
        text: readableText(link),
      }).toEqual({ target: '_blank', noopener: true, text: normalize(MESSAGES[locale].footer.telegram) });

      fireEvent.click(link);

      expect(spies.reachGoal.mock.calls).toEqual([[GOALS.telegramClick]]);
    },
  );

  it.each(DESIGN_NAMES.flatMap((design) => (['ru', 'en'] as const).map((locale) => [design, locale] as const)))(
    'C6 %s, %s: CTA в панели нет',
    async (design, locale) => {
      route.pathname = `/${locale}`;
      route.locale = locale;
      await renderHeader(design, { locale });

      const panel = await openMenu();
      const briefPaths = new Set([BRIEF_HREF, `/${locale}${BRIEF_HREF}`]);
      const briefLinks = [...panel.querySelectorAll('a[href]')]
        .map((link) => link.getAttribute('href') ?? '')
        .filter((href) => briefPaths.has(new URL(href, 'http://localhost').pathname));

      expect(briefLinks, 'ссылки на квиз в панели нет').toEqual([]);
      expect(readableText(panel)).not.toContain(normalize(MESSAGES[locale].header.cta));
    },
  );

  it.each(
    DESIGN_NAMES.flatMap((design) => [
      [design, 'главная, «Услуги» под шапкой', '/ru', SERVICES_UNDER_HEADER] as const,
      [design, 'страница услуги', `/ru/${SERVICE_SLUG}`, null] as const,
      [design, 'все кейсы', '/ru/work', null] as const,
    ]),
  )('C7 %s, %s: подсветка пунктов панели — как у меню шапки', async (design, page, pathname, layout) => {
    route.pathname = pathname;

    if (layout) {
      setLayout(layout);
    }

    await renderHeader(design);

    const panel = await openMenu();
    const header = currentOf(headerNavLinks(panel));

    if (layout) {
      expect(
        header.find(({ href }) => href === '/ru#services')?.current ?? null,
        `${page}: в шапке «Услуги» подсвечен`,
      ).not.toBeNull();
    }

    expect(currentOf(panelNavLinks(panel, 'ru'))).toEqual(header);
  });

  it.each(DESIGN_NAMES)('C8 %s: закрытая панель не дублирует переключатели шапки и Telegram', async (design) => {
    await renderHeader(design);

    const counts = () => ({
      theme: countOf('[data-testid="theme-toggle"]'),
      localeRu: countOf('[data-testid="locale-ru"]'),
      localeEn: countOf('[data-testid="locale-en"]'),
      telegram: telegramLinks(document).length,
    });
    const single = { theme: 1, localeRu: 1, localeEn: 1, telegram: 0 };

    expect(counts(), 'до открытия').toEqual(single);

    await openMenu();
    await clickBurger();

    expectClosed();
    expect(counts(), 'после закрытия').toEqual(single);
  });
});

/**
 * Editorial на ≤720: мастхед уезжает, липнет строка 49px с колонтитулом и бургером → линия подсветки — 49 + допуск
 * `useActiveSection` (12), выше порога — строка меню 47 + 12. Секция с верхом 60 лежит между линиями 59 и 61.
 */
const EDITORIAL_SERVICES_AT_60: Layout = {
  services: [60, 1500],
  work: [1500, 2500],
  process: [2500, 4500],
  contacts: [4500, 5000],
};

const EDITORIAL_PROCESS_UNDER_HEADER: Layout = {
  services: [-3000, -1500],
  work: [-1500, 0],
  process: [0, 2000],
  contacts: [2000, 3000],
};

const EDITORIAL_BEFORE_FIRST_SECTION: Layout = {
  services: [800, 1500],
  work: [1500, 2500],
  process: [2500, 4500],
  contacts: [4500, 5000],
};

/** Подпись пункта меню в `aria-hidden` шапки — колонтитул липкой строки (скринридер его не читает). */
const runningHeads = () => {
  const labels = new Set<string>(NAV_ITEMS.map((item) => ruMessages.nav[item]));

  return [...document.querySelectorAll('header [aria-hidden="true"]')]
    .map((element) => normalize(element.textContent ?? ''))
    .filter((text) => labels.has(text));
};

describe('Editorial на телефоне: липкая строка', () => {
  it('E1 линия подсветки — 49 на ≤720 и 47 выше порога', async () => {
    setLayout(EDITORIAL_SERVICES_AT_60);
    await renderHeader('editorial');

    const servicesCurrent = () =>
      document.querySelector('header nav a[href="/ru#services"]')?.getAttribute('aria-current') ?? null;

    expect(servicesCurrent(), '390: «Услуги» с верхом 60 дошли до линии 49 + 12').not.toBeNull();

    await setWidth(THRESHOLD.editorial + 1);

    expect(servicesCurrent(), '721: «Услуги» с верхом 60 ниже линии 47 + 12').toBeNull();
  });

  it('E2 колонтитул — подпись текущего раздела, до первой секции пусто', async () => {
    setLayout(EDITORIAL_PROCESS_UNDER_HEADER);
    const view = await renderHeader('editorial');

    expect(runningHeads(), 'под шапкой «Процесс»').toEqual([ruMessages.nav.process]);

    view.unmount();
    setLayout(EDITORIAL_BEFORE_FIRST_SECTION);
    await renderHeader('editorial');

    expect(runningHeads(), 'до первой секции').toEqual([]);
  });
});
