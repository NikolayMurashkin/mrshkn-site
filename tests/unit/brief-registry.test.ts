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

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

const DESIGN_SECTIONS = [
  ['kinetic', KineticSection],
  ['terminal', TerminalSection],
  ['pop', PopSection],
  ['swiss', SwissSection],
  ['editorial', EditorialSection],
] as const;

const SRC_DIR = resolve(import.meta.dirname, '../../src');
const BRIEF_DIR = join(SRC_DIR, 'components', 'Brief');

const LAYOUT_FILES = [
  'Brief.tsx',
  'BriefView.tsx',
  'BriefThanks.tsx',
  'BriefThanksView.tsx',
  'Choices.tsx',
  'DesignChoice.tsx',
  'DesignThumb.tsx',
  'Brief.module.scss',
  'BriefThanks.module.scss',
];

const LAYOUT_NAMES = new Set(LAYOUT_FILES.flatMap((file) => [file, file.replace(/\.(tsx|scss)$/, '')]));

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.scss'];

const SPECIFIER_PATTERNS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
  /@(?:use|import)\s+['"]([^'"]+)['"]/g,
];

const briefType = (Section: (typeof DESIGN_SECTIONS)[number][1], design: (typeof DESIGN_SECTIONS)[number][0]) =>
  (Section({ section: 'brief', design, plan: null, niche: null }) as ReactElement).type;

const thanksType = (Section: (typeof DESIGN_SECTIONS)[number][1]) =>
  (Section({ section: 'briefThanks' }) as ReactElement).type;

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

  return target !== null && dirname(target) === BRIEF_DIR && LAYOUT_NAMES.has(basename(target));
};

describe('секции квиза в реестре направлений', () => {
  it('таблица направлений совпадает с DESIGN_NAMES', () => {
    expect(DESIGN_SECTIONS.map(([design]) => design)).toEqual([...DESIGN_NAMES]);
  });

  it.each(DESIGN_SECTIONS)('%s отдает для brief свой компонент', (design, Section) => {
    const element = Section({ section: 'brief', design, plan: null, niche: null }) as ReactElement;
    const others = DESIGN_SECTIONS.filter(([name]) => name !== design);

    expect(typeof element.type).toBe('function');
    expect(element.props).toMatchObject({ design, plan: null });
    for (const [otherDesign, OtherSection] of others) {
      expect(element.type).not.toBe(briefType(OtherSection, otherDesign));
    }
  });

  it.each(DESIGN_SECTIONS)('%s отдает для briefThanks свой компонент', (design, Section) => {
    const element = Section({ section: 'briefThanks' }) as ReactElement;
    const others = DESIGN_SECTIONS.filter(([name]) => name !== design);

    expect(typeof element.type).toBe('function');
    for (const [, OtherSection] of others) {
      expect(element.type).not.toBe(thanksType(OtherSection));
    }
  });

  it('в SECTION_NAMES есть brief и briefThanks', () => {
    expect(SECTION_NAMES).toContain('brief');
    expect(SECTION_NAMES).toContain('briefThanks');
  });

  it('в src/components/Brief нет файлов общей верстки квиза, только логика .ts', () => {
    const files = readdirSync(BRIEF_DIR);
    const layout = files.filter(
      (file) => LAYOUT_FILES.includes(file) || file.endsWith('.tsx') || file.endsWith('.scss'),
    );

    expect(layout, `файлы верстки в src/components/Brief: ${files.join(', ')}`).toEqual([]);
  });

  it('ни один модуль src не импортирует общую верстку квиза', () => {
    const imports = sourceFiles(SRC_DIR).flatMap((file) =>
      specifiersOf(readFileSync(file, 'utf8'))
        .filter((specifier) => pointsToLayout(file, specifier))
        .map((specifier) => `${relative(SRC_DIR, file)} → ${specifier}`),
    );

    expect(imports, `импорты общей верстки:\n${imports.join('\n')}`).toEqual([]);
  });
});
