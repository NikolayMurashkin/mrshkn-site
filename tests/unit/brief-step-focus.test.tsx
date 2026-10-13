// @vitest-environment jsdom
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BriefProps } from '@/components/Brief/types';
import { EditorialBrief } from '@/designs/editorial/EditorialBrief';
import { KineticBrief } from '@/designs/kinetic/KineticBrief';
import { PopBrief } from '@/designs/pop/PopBrief';
import { SwissBrief } from '@/designs/swiss/SwissBrief';
import { TerminalBrief } from '@/designs/terminal/TerminalBrief';
import type { DesignName } from '@/designs/types';
import messages from '../../messages/ru.json';

/**
 * Квиз на клавиатуре и в скринридере: после «Далее» и «Назад» фокус переезжает на заголовок нового шага, иначе
 * он остается на кнопке, а новый шаг не прочитан. Первый показ фокус не крадет. Перенос фокуса живет в одном
 * общем хуке, квиз каждого направления только вызывает его.
 */

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/brief',
  Link: ({ children }: { children: unknown }) => children,
}));

const ROOT = join(import.meta.dirname, '..', '..');
const HOOK_FILE = 'src/components/Brief/use-step-focus.ts';
const HOOK_MODULE = '@/components/Brief/use-step-focus';

const BRIEFS: [DesignName, string, ComponentType<BriefProps>][] = [
  ['kinetic', 'KineticBrief', KineticBrief],
  ['terminal', 'TerminalBrief', TerminalBrief],
  ['pop', 'PopBrief', PopBrief],
  ['swiss', 'SwissBrief', SwissBrief],
  ['editorial', 'EditorialBrief', EditorialBrief],
];

const STEP_TITLES = messages.brief.steps;

let reduceMotion = false;

const mockMatchMedia = () =>
  vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion')
      ? query.includes('no-preference')
        ? !reduceMotion
        : reduceMotion
      : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

const renderBrief = (Brief: ComponentType<BriefProps>, design: DesignName) =>
  render(
    <NextIntlClientProvider
      locale="ru"
      timeZone="Europe/Moscow"
      messages={messages}
    >
      <Brief
        design={design}
        plan={null}
      />
    </NextIntlClientProvider>,
  );

const step = (name: string) => document.querySelector<HTMLElement>(`[data-testid="brief-step"][data-step="${name}"]`);

const stepHeading = (name: keyof typeof STEP_TITLES) =>
  within(step(name) as HTMLElement).getByRole('heading', { name: STEP_TITLES[name].title });

const goToNiche = () => {
  fireEvent.click(document.querySelector('[data-testid="brief-option"][data-value="miniApp"]') as HTMLElement);
  fireEvent.click(screen.getByTestId('brief-next'));
};

/** Что видно у элемента в фокусе: заголовок ли это, в каком шаге и с каким текстом. */
const focused = () => {
  const active = document.activeElement as HTMLElement;

  return {
    heading: active.matches('h1, h2, h3, h4, h5, h6, [role="heading"]'),
    step: active.closest('[data-testid="brief-step"]')?.getAttribute('data-step') ?? null,
    text: active.textContent?.trim() ?? '',
  };
};

beforeEach(() => {
  reduceMotion = false;
  window.matchMedia = mockMatchMedia() as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe.each(BRIEFS)('квиз %s: фокус на заголовке шага', (design, _name, Brief) => {
  it('первый показ не переносит фокус', () => {
    renderBrief(Brief, design);

    expect(document.activeElement).toBe(document.body);
  });

  it('после «Далее» фокус на заголовке нового шага', () => {
    renderBrief(Brief, design);
    goToNiche();

    expect(focused()).toEqual({ heading: true, step: 'niche', text: STEP_TITLES.niche.title });
  });

  it('после «Назад» фокус на заголовке прошлого шага', () => {
    renderBrief(Brief, design);
    goToNiche();
    fireEvent.click(screen.getByTestId('brief-back'));

    expect(focused()).toEqual({ heading: true, step: 'product', text: STEP_TITLES.product.title });
  });

  it.each([
    [true, 'auto'],
    [false, 'smooth'],
  ])('при reduced motion = %s заголовок прокручивается с behavior %s', (reduce, behavior) => {
    reduceMotion = reduce;
    renderBrief(Brief, design);
    goToNiche();

    const scroll = vi.mocked(Element.prototype.scrollIntoView);
    const heading = stepHeading('niche');
    const headingCalls = scroll.mock.calls.filter((_, index) => scroll.mock.contexts[index] === heading);

    expect(headingCalls).toEqual([[{ behavior, block: 'start' }]]);
  });
});

describe('перенос фокуса в квизах — в одном общем хуке', () => {
  const listFiles = (dir: string) =>
    readdirSync(join(ROOT, dir), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)));

  const read = (path: string) => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), 'utf8') : '');

  it('.focus( только в use-step-focus.ts, хук экспортирован, все пять квизов его импортируют', () => {
    const briefFiles = readdirSync(join(ROOT, 'src', 'designs'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => listFiles(join('src', 'designs', entry.name)))
      .filter((path) => /^src\/designs\/[^/]+\/[^/]*Brief[^/]*\.tsx$/.test(path));
    const quizFiles = [...briefFiles, ...listFiles(join('src', 'components', 'Brief'))];
    const hookSource = read(HOOK_FILE);
    const importsHook = new RegExp(
      `import\\s*\\{[^}]*\\buseStepFocus\\b[^}]*\\}\\s*from\\s*['"]${HOOK_MODULE.replace(/[/.]/g, '\\$&')}['"]`,
    );

    expect({
      focusFiles: quizFiles.filter((path) => read(path).includes('.focus(')),
      exportsHook:
        /export\s+(?:const|function|let)\s+useStepFocus\b/.test(hookSource) ||
        /export\s*\{[^}]*\buseStepFocus\b[^}]*\}/.test(hookSource),
      withoutHook: BRIEFS.map(([design, name]) => `src/designs/${design}/${name}.tsx`).filter(
        (path) => !importsHook.test(read(path)),
      ),
    }).toEqual({
      focusFiles: [HOOK_FILE],
      exportsHook: true,
      withoutHook: [],
    });
  });
});
