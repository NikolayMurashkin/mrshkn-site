import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { DESIGN_NAMES } from '@/designs/consts';
import messages from '../../messages/ru.json';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

type TestCase = {
  title: string;
  slug: string;
  kind: 'demo' | 'client';
  niche: string;
  design: string | null;
  demoUrl: string | null;
  metrics: { value: string; label: string }[];
  cover: { url: string; alt: string };
};

type TestCaseDetail = TestCase & {
  task: string;
  solution: string;
  lighthouse: { url: string; alt: string } | null;
  stack: string[];
  appUrl: string | null;
};

const CARD_MARKER = 'data-testid="case-card"';
const METRIC_MARKER = 'data-testid="case-metric"';
const CARD_METRICS: Record<string, number> = { swiss: 2 };
const DEFAULT_CARD_METRICS = 3;

const makeCase = (slug: string, kind: 'demo' | 'client', metrics: TestCase['metrics'] = []): TestCase => ({
  title: `Кейс ${slug}`,
  slug,
  kind,
  niche: 'clinic',
  design: 'swiss',
  demoUrl: kind === 'demo' ? `https://${slug}.mrshkn.com` : null,
  metrics,
  cover: { url: `/media/${slug}.png`, alt: `Обложка ${slug}` },
});

const makeMetrics = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ value: `${70 + index}-znach`, label: `Метрика ${index + 1}` }));

const MODULES = import.meta.glob('../../src/designs/*/{Works,Case,Header}.tsx');

const loadComponent = async <Props>(
  design: string,
  file: 'Works' | 'Case' | 'Header',
): Promise<ComponentType<Props>> => {
  const name = `${design[0].toUpperCase()}${design.slice(1)}${file}`;
  const load = MODULES[`../../src/designs/${design}/${file}.tsx`];
  const designModule = (load ? await load() : {}) as Record<string, unknown>;

  const component = designModule[name];

  expect(component, `у направления ${design} нет ${file}`).toBeTypeOf('function');

  return component as ComponentType<Props>;
};

type ProviderProps = { locale: string; messages: typeof messages; children?: ReactNode };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const render = <Props extends object>(component: ComponentType<Props>, props: Props) =>
  renderToStaticMarkup(createElement(Provider, { locale: 'ru', messages }, createElement(component, props)));

const count = (html: string, marker: string) => html.split(marker).length - 1;

const cardsOf = (html: string) => html.split(CARD_MARKER).slice(1);

/** Видимый текст разметки: без тегов, пробелы схлопнуты. */
const textOf = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Ссылки разметки с видимым текстом: внутри ссылки бывают иконки, поэтому текст — без тегов. */
const linksOf = (html: string) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, inner]) => ({
    href: /\bhref="([^"]*)"/.exec(attributes)?.[1] ?? null,
    text: textOf(inner),
  }));

/** Элемент с `data-testid` целиком, до парного закрывающего тега; нет элемента — `null`. */
const elementByTestId = (html: string, testId: string) => {
  const start = html.lastIndexOf('<', html.indexOf(`data-testid="${testId}"`));

  if (!html.includes(`data-testid="${testId}"`) || start < 0) {
    return null;
  }

  const tag = /^<([a-z0-9]+)/.exec(html.slice(start))?.[1] ?? '';
  const pattern = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'g');

  pattern.lastIndex = start;

  let depth = 0;

  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    depth += match[0].startsWith('</') ? -1 : 1;

    if (depth === 0) {
      return html.slice(start, match.index + match[0].length);
    }
  }

  return null;
};

const makeDetail = (overrides: Partial<TestCaseDetail> = {}): TestCaseDetail => ({
  ...makeCase('alpha', 'demo'),
  task: 'Текст-задачи-кейса',
  solution: 'Текст-решения-кейса',
  lighthouse: null,
  stack: [],
  appUrl: null,
  ...overrides,
});

/** Секция «Работы»: на главной — три новых кейса, на странице `/work` — все. */
type WorksTestProps = { cases: TestCase[]; variant?: 'home' | 'page' };

const ALL_WORK_HREF = '/ru/work';

const ALL_WORK_TEXT = 'Все работы';

const SLUGS_FOUR = ['alpha', 'beta', 'gamma', 'delta'];

describe('секция «Работы»', () => {
  it.each([...DESIGN_NAMES])(
    '%s: на каждый кейс своя карточка, у demo пометка «демо-проект студии», у client «клиент»',
    async (design) => {
      const Works = await loadComponent<{ cases: TestCase[] }>(design, 'Works');
      const cases = [makeCase('alpha', 'demo'), makeCase('beta', 'client'), makeCase('gamma', 'demo')];

      const html = render(Works, { cases });
      const cards = cardsOf(html);

      expect(cards).toHaveLength(3);

      cards.forEach((card, index) => {
        const { kind, slug } = cases[index];
        const text = card.replace(/<[^>]*>/g, ' ').toLowerCase();

        expect(text.includes('демо-проект студии'), `${slug}: пометка demo`).toBe(kind === 'demo');
        expect(text.includes('клиент'), `${slug}: пометка client`).toBe(kind === 'client');
        expect(card).toContain(`href="/ru/work/${slug}"`);
      });
    },
  );

  it.each([...DESIGN_NAMES])('%s: на карточке лимит метрик направления, первые по порядку', async (design) => {
    const Works = await loadComponent<{ cases: TestCase[] }>(design, 'Works');
    const metrics = makeMetrics(5);
    const limit = CARD_METRICS[design] ?? DEFAULT_CARD_METRICS;

    const html = render(Works, { cases: [makeCase('alpha', 'demo', metrics)] });
    const [card] = cardsOf(html);

    expect(count(card, METRIC_MARKER)).toBe(limit);
    metrics.slice(0, limit).forEach(({ value }) => expect(card).toContain(value));
    metrics.slice(limit).forEach(({ value }) => expect(card).not.toContain(value));
  });

  it.each([...DESIGN_NAMES])('%s: при пустом списке секция рендерит пустую строку', async (design) => {
    const Works = await loadComponent<{ cases: TestCase[] }>(design, 'Works');

    expect(render(Works, { cases: [] })).toBe('');
  });
});

describe('секция «Работы»: три на главной, все на странице', () => {
  it.each([...DESIGN_NAMES])(
    '%s: из четырех кейсов на главной три первых по порядку и ссылка «Все работы» на /work',
    async (design) => {
      const Works = await loadComponent<WorksTestProps>(design, 'Works');

      const html = render(Works, { cases: SLUGS_FOUR.map((slug) => makeCase(slug, 'demo')) });
      const cards = cardsOf(html);

      expect(cards).toHaveLength(3);
      ['alpha', 'beta', 'gamma'].forEach((slug, index) => expect(cards[index]).toContain(`href="/ru/work/${slug}"`));
      expect(html).not.toContain('href="/ru/work/delta"');

      const allLinks = linksOf(html).filter(({ href }) => href === ALL_WORK_HREF);

      expect(allLinks).toHaveLength(1);
      expect(allLinks[0].text).toContain(ALL_WORK_TEXT);
    },
  );

  it.each([...DESIGN_NAMES])('%s: из трех кейсов три карточки и нет ссылки на /work', async (design) => {
    const Works = await loadComponent<WorksTestProps>(design, 'Works');

    const html = render(Works, { cases: ['alpha', 'beta', 'gamma'].map((slug) => makeCase(slug, 'demo')) });

    expect(cardsOf(html)).toHaveLength(3);
    expect(count(html, `href="${ALL_WORK_HREF}"`)).toBe(0);
  });

  it.each([...DESIGN_NAMES])(
    '%s: на странице /work все четыре карточки по порядку, без «Все работы», заголовок секции — h1',
    async (design) => {
      const Works = await loadComponent<WorksTestProps>(design, 'Works');

      const html = render(Works, { cases: SLUGS_FOUR.map((slug) => makeCase(slug, 'demo')), variant: 'page' });
      const cards = cardsOf(html);

      expect(cards).toHaveLength(4);
      SLUGS_FOUR.forEach((slug, index) => expect(cards[index]).toContain(`href="/ru/work/${slug}"`));
      expect(count(html, `href="${ALL_WORK_HREF}"`)).toBe(0);
      expect(textOf(html)).not.toContain(ALL_WORK_TEXT);
      expect(count(html, '<h1')).toBe(1);
      expect(count(html, '<h2')).toBe(0);
    },
  );
});

const SECTION_MODULES = import.meta.glob('../../src/designs/*/index.tsx');

/** Секция направления целиком, как ее рисует `DesignSection` страницы: `<Name>Section` → `renderSection` → компонент. */
const loadSection = async (design: string): Promise<ComponentType<Record<string, unknown>>> => {
  const name = `${design[0].toUpperCase()}${design.slice(1)}Section`;
  const designModule = (await SECTION_MODULES[`../../src/designs/${design}/index.tsx`]()) as Record<string, unknown>;

  expect(designModule[name], `у направления ${design} нет ${name}`).toBeTypeOf('function');

  return designModule[name] as ComponentType<Record<string, unknown>>;
};

describe('секция «Работы» через секцию направления, как на странице', () => {
  it.each([...DESIGN_NAMES])(
    '%s: section="works" variant="page" — все четыре карточки и h1, без «Все работы»',
    async (design) => {
      const Section = await loadSection(design);

      const html = render(Section, {
        section: 'works',
        variant: 'page',
        cases: SLUGS_FOUR.map((slug) => makeCase(slug, 'demo')),
      });

      expect(cardsOf(html)).toHaveLength(4);
      expect(count(html, '<h1')).toBe(1);
      expect(count(html, `href="${ALL_WORK_HREF}"`)).toBe(0);
    },
  );

  it.each([...DESIGN_NAMES])('%s: section="works" без variant — три карточки и «Все работы»', async (design) => {
    const Section = await loadSection(design);

    const html = render(Section, { section: 'works', cases: SLUGS_FOUR.map((slug) => makeCase(slug, 'demo')) });

    expect(cardsOf(html)).toHaveLength(3);
    expect(count(html, `href="${ALL_WORK_HREF}"`)).toBe(1);
  });
});

describe('isWorkPath: текущая страница для пункта «Кейсы»', () => {
  it.each([
    ['/work', true],
    ['/work/alpha', true],
    ['/', false],
    ['/workshop', false],
    ['/work-x', false],
    ['/services', false],
  ])('%s → %s', async (pathname, expected) => {
    const { isWorkPath } = await import('@/designs/nav');

    expect(isWorkPath(pathname)).toBe(expected);
  });
});

describe('пункт меню «Кейсы»', () => {
  const anchors = (html: string) =>
    [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, href, text]) => ({ href, text }));

  it.each([...DESIGN_NAMES])(
    '%s: без кейсов ссылки /ru/work нет, с кейсами она между «Услуги» и «Цены» и ведет на страницу /work',
    async (design) => {
      const Header = await loadComponent<{ hasCases: boolean }>(design, 'Header');

      expect(anchors(render(Header, { hasCases: false })).map(({ href }) => href)).not.toContain('/ru/work');

      const links = anchors(render(Header, { hasCases: true }));
      const hrefs = links.map(({ href }) => href);

      expect(links).toContainEqual({ href: '/ru/work', text: 'Кейсы' });
      expect(hrefs).not.toContain('/ru#work');
      expect(hrefs.indexOf('/ru#services')).toBeGreaterThanOrEqual(0);
      expect(hrefs.indexOf('/ru/work')).toBeGreaterThan(hrefs.indexOf('/ru#services'));
      expect(hrefs.indexOf('/ru#prices')).toBeGreaterThan(hrefs.indexOf('/ru/work'));
    },
  );
});

describe('страница кейса', () => {
  it.each([...DESIGN_NAMES])('%s: задача, решение, результаты и скрин Lighthouse идут по порядку', async (design) => {
    const Case = await loadComponent<{ caseItem: TestCaseDetail }>(design, 'Case');
    const metrics = makeMetrics(5);
    const caseItem: TestCaseDetail = {
      ...makeCase('alpha', 'demo', metrics),
      task: 'Текст-задачи-кейса',
      solution: 'Текст-решения-кейса',
      lighthouse: { url: '/media/lighthouse-alpha.png', alt: 'Скрин Lighthouse' },
      stack: [],
      appUrl: null,
    };

    const html = render(Case, { caseItem });
    const positions = ['case-task', 'case-solution', 'case-results', 'case-lighthouse'].map((id) =>
      html.indexOf(`data-testid="${id}"`),
    );

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    const results = html.slice(positions[2], positions[3]);

    expect(count(results, METRIC_MARKER)).toBe(5);
    metrics.forEach(({ value }) => expect(results).toContain(value));
    expect(html).toContain(caseItem.title);
  });

  it.each([...DESIGN_NAMES])('%s: ссылка «Все кейсы» ведет на страницу /work, не на якорь главной', async (design) => {
    const Case = await loadComponent<{ caseItem: TestCaseDetail }>(design, 'Case');

    const links = linksOf(render(Case, { caseItem: makeDetail() }));

    expect(links).toContainEqual({ href: ALL_WORK_HREF, text: expect.stringContaining('Все кейсы') });
    expect(links.map(({ href }) => href)).not.toContain('/ru#work');
  });
});

describe('страница кейса: стек, Mini App и стиль', () => {
  const STACK = [
    'Next.js',
    'Payload',
    'PostgreSQL',
    'TypeScript',
    'Telegram Mini Apps',
    'Сверхдлинноеназваниетехнологиибезпробелов',
  ];

  const DEMO_URL = 'https://alpha.mrshkn.com';

  const APP_URL = 'https://t.me/mrshkn_demo_bot/app';

  it.each([...DESIGN_NAMES])('%s: блок «Стек» списком — все технологии по порядку', async (design) => {
    const Case = await loadComponent<{ caseItem: TestCaseDetail }>(design, 'Case');

    const block = elementByTestId(render(Case, { caseItem: makeDetail({ stack: STACK }) }), 'case-stack');

    expect(block, 'блок case-stack').not.toBeNull();
    expect(textOf(block ?? '')).toContain('Стек');
    expect([...(block ?? '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, inner]) => textOf(inner))).toEqual(
      STACK,
    );
  });

  it.each([...DESIGN_NAMES])(
    '%s: при заполненном appUrl рядом с «Открыть демо» ссылка «Открыть Mini App»',
    async (design) => {
      const Case = await loadComponent<{ caseItem: TestCaseDetail }>(design, 'Case');

      const links = linksOf(render(Case, { caseItem: makeDetail({ demoUrl: DEMO_URL, appUrl: APP_URL }) }));

      expect(links).toContainEqual({ href: DEMO_URL, text: expect.stringContaining('Открыть демо') });
      expect(links).toContainEqual({ href: APP_URL, text: expect.stringContaining('Открыть Mini App') });
    },
  );

  it.each([...DESIGN_NAMES])('%s: без appUrl второй ссылки нет, «Открыть демо» есть', async (design) => {
    const Case = await loadComponent<{ caseItem: TestCaseDetail }>(design, 'Case');

    const html = render(Case, { caseItem: makeDetail({ demoUrl: DEMO_URL, appUrl: null }) });

    expect(textOf(html)).not.toContain('Открыть Mini App');
    expect(linksOf(html)).toContainEqual({ href: DEMO_URL, text: expect.stringContaining('Открыть демо') });
  });

  it.each([...DESIGN_NAMES])('%s: при пустом стеке блока «Стек» нет', async (design) => {
    const Case = await loadComponent<{ caseItem: TestCaseDetail }>(design, 'Case');

    const html = render(Case, { caseItem: makeDetail({ stack: [] }) });

    expect(html).not.toContain('data-testid="case-stack"');
    expect(textOf(html)).not.toContain('Стек');
  });

  it.each([...DESIGN_NAMES])('%s: без design строки «Стиль» нет на карточке и на странице', async (design) => {
    const Works = await loadComponent<WorksTestProps>(design, 'Works');
    const Case = await loadComponent<{ caseItem: TestCaseDetail }>(design, 'Case');
    const withoutDesign = makeDetail({ design: null });
    const withDesign = makeDetail({ design: 'swiss' });

    expect(textOf(render(Works, { cases: [withoutDesign] }))).not.toContain('Стиль');
    expect(textOf(render(Case, { caseItem: withoutDesign }))).not.toContain('Стиль');
    expect(textOf(render(Works, { cases: [withDesign] }))).toContain('Стиль: Swiss');
    expect(textOf(render(Case, { caseItem: withDesign }))).toContain('Стиль: Swiss');
  });
});
