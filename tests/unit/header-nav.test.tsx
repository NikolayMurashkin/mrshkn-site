// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESIGN_NAMES, NAV_ITEMS } from '@/designs/consts';
import { navHref } from '@/designs/nav';
import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';

/**
 * Меню шапки всех пяти направлений: пункты (вместо «Цены», дублировавшего «Услуги», — «Процесс») и подсветка пункта
 * секции, дошедшей до линии под липкой шапкой, — одно правило для всех направлений, только на главной.
 * Раскладку jsdom не считает → прямоугольники секций подменены, линия под шапкой у направлений 47–120 px,
 * значения `top` в сценариях выбраны вдали от нее; у сценария прыжка к якорю — нарочно рядом.
 */

const route = vi.hoisted(() => ({ pathname: '/ru', locale: 'ru' }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => route.pathname,
  useParams: () => ({ locale: route.locale }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', resolvedTheme: 'dark', setTheme: vi.fn() }),
}));

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

type Locale = 'ru' | 'en';

type SectionId = 'services' | 'work' | 'process' | 'contacts';

/** Прямоугольник секции в окне: `[top, bottom]`. */
type Layout = Record<SectionId, [number, number]>;

const VIEWPORT_HEIGHT = 900;

const PAGE_HEIGHT = 10_000;

const MESSAGES = { ru: ruMessages, en: enMessages } as const;

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

/** «Как мы работаем» занимает линию под шапкой. */
const PROCESS_UNDER_HEADER: Layout = {
  services: [-5000, -3000],
  work: [-3000, -100],
  process: [-100, 1500],
  contacts: [1500, 2000],
};

/** Страница докручена до конца: подвал короче экрана и до шапки не доходит. */
const PAGE_END: Layout = {
  services: [-4000, -2000],
  work: [-2000, -1000],
  process: [-1000, 400],
  contacts: [400, 900],
};

/** Под шапкой еще hero: верх «Услуг и цен» на 400 — внутри полосы 35–45 % окна. */
const HERO_UNDER_HEADER: Layout = {
  services: [400, 3000],
  work: [3000, 4000],
  process: [4000, 6000],
  contacts: [6000, 6500],
};

/**
 * Высота липкой шапки направления — его `scroll-padding-top`: после клика по якорю верх секции встает на эту линию.
 * Числами, не импортом констант направлений: тест ловит и неверную константу.
 */
const HEADER_HEIGHT: Record<string, number> = { kinetic: 96, terminal: 88, pop: 108, swiss: 85, editorial: 47 };

/** Сдвиг после прыжка к якорю (округление, догрузка шрифта): секция чуть ниже линии шапки все еще текущая. */
const ANCHOR_LANDING_SLACK = 6;

/** Страница не главная и не услуга: на услуге «Услуги» помечен как текущая страница (`aria-current="page"`). */
const NOT_HOME_PATH = '/ru/docs/privacy';

const HEADERS = import.meta.glob('../../src/designs/*/Header.tsx');

const loadHeader = async (design: string): Promise<ComponentType<{ hasCases: boolean }>> => {
  const name = `${design[0].toUpperCase()}${design.slice(1)}Header`;
  const load = HEADERS[`../../src/designs/${design}/Header.tsx`];
  const designModule = (load ? await load() : {}) as Record<string, unknown>;

  expect(designModule[name], `у направления ${design} нет ${name}`).toBeTypeOf('function');

  return designModule[name] as ComponentType<{ hasCases: boolean }>;
};

const setScroll = (scrollY: number, scrollHeight: number) => {
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: scrollY });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: scrollHeight });
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

/** Два кадра отрисовки: подсветка пересчитывается в кадре после `scroll`. */
const settle = () =>
  act(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
      }),
  );

const renderHeader = async (
  design: string,
  { locale = 'ru', hasCases = true }: { locale?: Locale; hasCases?: boolean } = {},
) => {
  const Header = await loadHeader(design);

  const view = render(
    <NextIntlClientProvider
      locale={locale}
      timeZone="Europe/Moscow"
      messages={MESSAGES[locale]}
    >
      <Header hasCases={hasCases} />
    </NextIntlClientProvider>,
  );

  await settle();

  return view.container;
};

const navLinks = (container: HTMLElement) => [...container.querySelectorAll<HTMLAnchorElement>('header nav a')];

const linksOf = (container: HTMLElement) =>
  navLinks(container).map((link) => ({ href: link.getAttribute('href'), text: link.textContent?.trim() }));

/** Подписи пунктов меню с `aria-current`. */
const currentOf = (container: HTMLElement) =>
  navLinks(container)
    .filter((link) => link.hasAttribute('aria-current'))
    .map((link) => link.textContent?.trim());

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
  vi.stubGlobal('IntersectionObserver', SilentIntersectionObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 0),
  );
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: VIEWPORT_HEIGHT });
  setScroll(0, PAGE_HEIGHT);
});

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-test-section]').forEach((section) => section.remove());
  vi.unstubAllGlobals();
});

describe('пункты меню шапки', () => {
  it.each(DESIGN_NAMES.flatMap((design) => (['ru', 'en'] as const).map((locale) => [design, locale] as const)))(
    '%s, %s: Услуги, Кейсы, Процесс, Контакты — «Процесс» вместо «Цены»',
    async (design, locale) => {
      route.pathname = `/${locale}`;
      route.locale = locale;

      const links = linksOf(await renderHeader(design, { locale }));

      expect(links).toEqual(EXPECTED_LINKS[locale]);
      expect(links.filter(({ href }) => href?.includes('#prices'))).toEqual([]);
    },
  );

  it.each(DESIGN_NAMES)('%s: без кейсов — Услуги, Процесс, Контакты', async (design) => {
    const links = linksOf(await renderHeader(design, { hasCases: false }));

    expect(links.map(({ href }) => href)).toEqual(['/ru#services', '/ru#process', '/ru#contacts']);
  });

  it('NAV_ITEMS и navHref: «Процесс» ведет к секции «Как мы работаем» главной', () => {
    expect([...NAV_ITEMS]).toEqual(['services', 'work', 'process', 'contacts']);
    expect(navHref('ru', 'process')).toBe('/ru#process');
    expect(navHref('en', 'process')).toBe('/en#process');
    expect(navHref('ru', 'work')).toBe('/ru/work');
  });
});

describe('подсветка пункта меню на главной', () => {
  it.each(DESIGN_NAMES)('%s: подсвечен пункт секции под шапкой — «Услуги»', async (design) => {
    setLayout(SERVICES_UNDER_HEADER);

    expect(currentOf(await renderHeader(design))).toEqual(['Услуги']);
  });

  it.each(DESIGN_NAMES)('%s: на секции «Как мы работаем» подсвечен «Процесс»', async (design) => {
    setLayout(PROCESS_UNDER_HEADER);

    expect(currentOf(await renderHeader(design))).toEqual(['Процесс']);
  });

  it.each(DESIGN_NAMES)('%s: подсветка идет за прокруткой — с «Услуги» на «Процесс»', async (design) => {
    setLayout(SERVICES_UNDER_HEADER);

    const container = await renderHeader(design);

    expect(currentOf(container)).toEqual(['Услуги']);

    setLayout(PROCESS_UNDER_HEADER);
    setScroll(SERVICES_UNDER_HEADER.services[0] - PROCESS_UNDER_HEADER.services[0], PAGE_HEIGHT);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    await settle();

    expect(currentOf(container)).toEqual(['Процесс']);
  });

  it.each(DESIGN_NAMES)('%s: в конце страницы подсвечены «Контакты»', async (design) => {
    const scrollY = 4100;

    setLayout(PAGE_END);
    setScroll(scrollY, VIEWPORT_HEIGHT + scrollY);

    expect(currentOf(await renderHeader(design))).toEqual(['Контакты']);
  });

  it.each(DESIGN_NAMES)('%s: секция встала под шапку после клика по якорю — подсвечен ее пункт', async (design) => {
    const top = HEADER_HEIGHT[design] + ANCHOR_LANDING_SLACK;

    setLayout({
      services: [-3000, -1000],
      work: [-1000, top],
      process: [top, top + 1600],
      contacts: [top + 1600, top + 2100],
    });

    expect(currentOf(await renderHeader(design))).toEqual(['Процесс']);
  });

  it.each(DESIGN_NAMES)('%s: секция еще ниже шапки — ничего не подсвечено', async (design) => {
    setLayout(HERO_UNDER_HEADER);

    expect(currentOf(await renderHeader(design))).toEqual([]);
  });

  it.each(DESIGN_NAMES)('%s: не на главной якорные пункты не подсвечены', async (design) => {
    route.pathname = NOT_HOME_PATH;
    setLayout(SERVICES_UNDER_HEADER);

    const container = await renderHeader(design);
    const anchors = navLinks(container).filter((link) => link.getAttribute('href')?.includes('#'));

    expect(anchors.filter((link) => link.hasAttribute('aria-current')).map((link) => link.textContent?.trim())).toEqual(
      [],
    );
  });
});
