// @vitest-environment jsdom
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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
 * Клик по ответу квиза до гидрации React теряет молча: ответ не выбирается, «Дальше» остается недоступной. Поэтому
 * из SSR кнопки ответов и «Дальше» приходят `disabled`, после монтирования — доступны. Признак «смонтировано» живет
 * в одном общем хуке, квиз каждого направления только пробрасывает его в кнопки.
 */

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/brief',
  Link: ({ children }: { children: unknown }) => children,
}));

const ROOT = join(import.meta.dirname, '..', '..');
const SRC_DIR = join(ROOT, 'src');
const HOOK_FILE = 'src/components/Brief/use-hydrated.ts';
const HOOK_MODULE = '@/components/Brief/use-hydrated';

const BRIEFS: [DesignName, string, ComponentType<BriefProps>][] = [
  ['kinetic', 'KineticBrief', KineticBrief],
  ['terminal', 'TerminalBrief', TerminalBrief],
  ['pop', 'PopBrief', PopBrief],
  ['swiss', 'SwissBrief', SwissBrief],
  ['editorial', 'EditorialBrief', EditorialBrief],
];

const briefElement = (Brief: ComponentType<BriefProps>, design: DesignName, plan: string | null) => (
  <NextIntlClientProvider
    locale="ru"
    timeZone="Europe/Moscow"
    messages={messages}
  >
    <Brief
      design={design}
      niche={null}
      plan={plan}
    />
  </NextIntlClientProvider>
);

/** HTML, который отдал бы сервер, разобранный в DOM: так видно атрибуты кнопок до гидрации. */
const serverMarkup = (Brief: ComponentType<BriefProps>, design: DesignName, plan: string | null) => {
  const container = document.createElement('div');

  container.innerHTML = renderToStaticMarkup(briefElement(Brief, design, plan));

  return container;
};

const options = (root: ParentNode) => [...root.querySelectorAll<HTMLButtonElement>('[data-testid="brief-option"]')];

const valuesOf = (buttons: HTMLButtonElement[]) => buttons.map((button) => button.getAttribute('data-value'));

const enabledOptions = (root: ParentNode) =>
  valuesOf(options(root).filter((button) => !button.hasAttribute('disabled')));

const disabledOptions = (root: ParentNode) =>
  valuesOf(options(root).filter((button) => button.hasAttribute('disabled')));

const nextButton = (root: ParentNode) => root.querySelector<HTMLButtonElement>('[data-testid="brief-next"]');

const option = (value: string) =>
  document.querySelector<HTMLButtonElement>(`[data-testid="brief-option"][data-value="${value}"]`) as HTMLButtonElement;

beforeEach(() => {
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe.each(BRIEFS)('квиз %s: ответы до и после гидрации', (design, _name, Brief) => {
  it('КОГДА квиз отрисован на сервере без тарифа, ТОГДА все ответы и «Дальше» приходят disabled', () => {
    const markup = serverMarkup(Brief, design, null);

    expect(options(markup).length).toBeGreaterThanOrEqual(1);
    expect(enabledOptions(markup)).toEqual([]);
    expect(nextButton(markup)).not.toBeNull();
    expect(nextButton(markup)?.hasAttribute('disabled')).toBe(true);
  });

  it('КОГДА квиз отрисован на сервере с тарифом miniApp, ТОГДА ответ предвыбран, но все ответы и «Дальше» disabled', () => {
    const markup = serverMarkup(Brief, design, 'miniApp');
    const miniApp = markup.querySelector('[data-testid="brief-option"][data-value="miniApp"]');

    expect(miniApp?.getAttribute('aria-pressed')).toBe('true');
    expect(enabledOptions(markup)).toEqual([]);
    expect(nextButton(markup)).not.toBeNull();
    expect(nextButton(markup)?.hasAttribute('disabled')).toBe(true);
  });

  it('КОГДА квиз смонтирован без тарифа, ТОГДА ответы доступны, клик выбирает ответ и открывает «Дальше»', () => {
    render(briefElement(Brief, design, null));

    expect(options(document).length).toBeGreaterThanOrEqual(1);
    expect(disabledOptions(document)).toEqual([]);
    expect(screen.getByTestId('brief-next').hasAttribute('disabled')).toBe(true);

    fireEvent.click(option('miniApp'));

    expect(option('miniApp').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('brief-next').hasAttribute('disabled')).toBe(false);
  });

  it('КОГДА квиз смонтирован с тарифом miniApp, ТОГДА «Дальше» доступна сразу, ответы без disabled', () => {
    render(briefElement(Brief, design, 'miniApp'));

    expect(screen.getByTestId('brief-next').hasAttribute('disabled')).toBe(false);
    expect(disabledOptions(document)).toEqual([]);
  });

  it('КОГДА после монтирования выбран ответ и нажата «Дальше», ТОГДА ответы шага «ниша» доступны', () => {
    render(briefElement(Brief, design, null));
    fireEvent.click(option('miniApp'));
    fireEvent.click(screen.getByTestId('brief-next'));

    const niche = document.querySelector('[data-testid="brief-step"][data-step="niche"]');

    expect(niche).not.toBeNull();
    expect(options(niche as Element).length).toBeGreaterThanOrEqual(1);
    expect(disabledOptions(niche as Element)).toEqual([]);
  });
});

describe('признак «смонтировано» у квизов — из одного файла', () => {
  const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

  const SPECIFIER_PATTERNS = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
  ];

  const read = (path: string) => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), 'utf8') : '');

  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);

      if (statSync(path).isDirectory()) {
        return sourceFiles(path);
      }

      return SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension)) ? [path] : [];
    });

  /** Путь модуля без расширения: `@/…` и относительные спецификаторы приводятся к файлу в `src/`. */
  const resolveSpecifier = (file: string, specifier: string) => {
    if (specifier.startsWith('@/')) {
      return relative(ROOT, join(SRC_DIR, specifier.slice(2)));
    }

    if (specifier.startsWith('.')) {
      return relative(ROOT, resolve(dirname(file), specifier)).replace(/\.tsx?$/, '');
    }

    return null;
  };

  it('use-hydrated.ts экспортирует useHydrated, его импортируют ровно пять квизов направлений', () => {
    const hookSource = read(HOOK_FILE);
    const hookPath = HOOK_FILE.replace(/\.ts$/, '');
    const importsHook = new RegExp(
      `import\\s*\\{[^}]*\\buseHydrated\\b[^}]*\\}\\s*from\\s*['"]${HOOK_MODULE.replace(/[/.]/g, '\\$&')}['"]`,
    );
    const briefPaths = BRIEFS.map(([design, name]) => `src/designs/${design}/${name}.tsx`);
    const importers = sourceFiles(SRC_DIR)
      .filter((file) =>
        [...SPECIFIER_PATTERNS.flatMap((pattern) => [...read(relative(ROOT, file)).matchAll(pattern)])].some(
          (match) => resolveSpecifier(file, match[1]) === hookPath,
        ),
      )
      .map((file) => relative(ROOT, file))
      .sort();

    expect({
      exportsHook:
        /export\s+(?:const|function|let)\s+useHydrated\b/.test(hookSource) ||
        /export\s*\{[^}]*\buseHydrated\b[^}]*\}/.test(hookSource),
      withoutHook: briefPaths.filter((path) => !importsHook.test(read(path))),
      importers,
    }).toEqual({
      exportsHook: true,
      withoutHook: [],
      importers: [...briefPaths].sort(),
    });
  });
});
