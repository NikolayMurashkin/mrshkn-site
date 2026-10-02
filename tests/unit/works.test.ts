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

type TestCase = {
  title: string;
  slug: string;
  kind: 'demo' | 'client';
  niche: string;
  design: string;
  demoUrl: string | null;
  metrics: { value: string; label: string }[];
  cover: { url: string; alt: string };
};

type TestCaseDetail = TestCase & { task: string; solution: string; lighthouse: { url: string; alt: string } | null };

const CARD_MARKER = 'data-testid="case-card"';
const METRIC_MARKER = 'data-testid="case-metric"';

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

  it.each([...DESIGN_NAMES])('%s: на карточке не больше трех метрик, первые по порядку', async (design) => {
    const Works = await loadComponent<{ cases: TestCase[] }>(design, 'Works');
    const metrics = makeMetrics(5);

    const html = render(Works, { cases: [makeCase('alpha', 'demo', metrics)] });
    const [card] = cardsOf(html);

    expect(count(card, METRIC_MARKER)).toBe(3);
    metrics.slice(0, 3).forEach(({ value }) => expect(card).toContain(value));
    metrics.slice(3).forEach(({ value }) => expect(card).not.toContain(value));
  });

  it.each([...DESIGN_NAMES])('%s: при пустом списке секция рендерит пустую строку', async (design) => {
    const Works = await loadComponent<{ cases: TestCase[] }>(design, 'Works');

    expect(render(Works, { cases: [] })).toBe('');
  });
});

describe('пункт меню «Кейсы»', () => {
  const anchors = (html: string) =>
    [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, href, text]) => ({ href, text }));

  it.each([...DESIGN_NAMES])(
    '%s: без кейсов ссылки /ru#work нет, с кейсами она между «Услуги» и «Цены»',
    async (design) => {
      const Header = await loadComponent<{ hasCases: boolean }>(design, 'Header');

      expect(anchors(render(Header, { hasCases: false })).map(({ href }) => href)).not.toContain('/ru#work');

      const links = anchors(render(Header, { hasCases: true }));
      const hrefs = links.map(({ href }) => href);

      expect(links).toContainEqual({ href: '/ru#work', text: 'Кейсы' });
      expect(hrefs.indexOf('/ru#services')).toBeGreaterThanOrEqual(0);
      expect(hrefs.indexOf('/ru#work')).toBeGreaterThan(hrefs.indexOf('/ru#services'));
      expect(hrefs.indexOf('/ru#prices')).toBeGreaterThan(hrefs.indexOf('/ru#work'));
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
});
