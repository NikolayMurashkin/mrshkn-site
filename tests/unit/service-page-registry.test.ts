import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DESIGN_NAMES, SECTION_NAMES } from '@/designs/consts';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { SectionProps } from '@/designs/types';

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

const DESIGNS = [
  ['kinetic', KineticSection],
  ['terminal', TerminalSection],
  ['pop', PopSection],
  ['swiss', SwissSection],
  ['editorial', EditorialSection],
] as const;

const SRC_DIR = resolve(import.meta.dirname, '../../src');
const SERVICE_PAGE_DIR = join(SRC_DIR, 'components', 'ServicePage');

const LAYOUT_FILES = ['ServicePage.tsx', 'ServicePageView.tsx', 'ServicePage.module.scss'];

const LAYOUT_NAMES = new Set(LAYOUT_FILES.flatMap((file) => [file, file.replace(/\.(tsx|scss)$/, '')]));

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.scss'];

const SPECIFIER_PATTERNS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
  /@(?:use|import)\s+['"]([^'"]+)['"]/g,
];

const servicePageProps = (service: string) => ({ section: 'servicePage', service }) as unknown as SectionProps;

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }

    return SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension)) ? [path] : [];
  });

const specifiersOf = (source: string) =>
  SPECIFIER_PATTERNS.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]));

const resolveSpecifier = (file: string, specifier: string) => {
  if (specifier.startsWith('@/')) {
    return join(SRC_DIR, specifier.slice(2));
  }

  if (specifier.startsWith('.')) {
    return resolve(dirname(file), specifier);
  }

  return null;
};

const pointsToLayout = (file: string, specifier: string) => {
  const target = resolveSpecifier(file, specifier);

  return target !== null && dirname(target) === SERVICE_PAGE_DIR && LAYOUT_NAMES.has(basename(target));
};

describe('секция страницы услуги в реестре направлений', () => {
  it('таблица направлений совпадает с DESIGN_NAMES', () => {
    expect(DESIGNS.map(([design]) => design)).toEqual([...DESIGN_NAMES]);
  });

  it('в SECTION_NAMES есть servicePage', () => {
    expect(SECTION_NAMES).toContain('servicePage');
  });

  it.each(DESIGNS)('%s отдает для servicePage свой компонент', (design, Section) => {
    const element = Section(servicePageProps('landing')) as ReactElement;
    const others = DESIGNS.filter(([name]) => name !== design);

    expect(typeof element.type).toBe('function');

    for (const [other, OtherSection] of others) {
      const otherType = (OtherSection(servicePageProps('landing')) as ReactElement).type;

      expect(element.type, `компонент ${other}`).not.toBe(otherType);
    }

    expect(element.props).toMatchObject({ service: 'landing' });
  });

  it('в src/components/ServicePage нет файлов общей верстки страницы услуги, только логика .ts', () => {
    const files = readdirSync(SERVICE_PAGE_DIR);
    const layout = files.filter(
      (file) => LAYOUT_FILES.includes(file) || file.endsWith('.tsx') || file.endsWith('.scss'),
    );

    expect(layout, `файлы верстки в src/components/ServicePage: ${files.join(', ')}`).toEqual([]);
  });

  it('ни один модуль src не импортирует общую верстку страницы услуги', () => {
    const imports = sourceFiles(SRC_DIR).flatMap((file) =>
      specifiersOf(readFileSync(file, 'utf8'))
        .filter((specifier) => pointsToLayout(file, specifier))
        .map((specifier) => `${relative(SRC_DIR, file)} → ${specifier}`),
    );

    expect(imports, `импорты общей верстки:\n${imports.join('\n')}`).toEqual([]);
  });
});
