import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DESIGN_NAMES } from '@/designs/consts';

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));
const TOKENS_DIR = join(SRC_DIR, 'styles', 'designs');

const REQUIRED_TOKENS = [
  '--font-display',
  '--font-text',
  '--bg',
  '--ink',
  '--ink-inverse',
  '--muted',
  '--line',
  '--accent',
  '--accent-ink',
  '--accent-contrast',
  '--surface',
  '--surface-soft',
  '--radius-control',
  '--radius-surface',
  '--border-width',
  '--border-width-strong',
  '--shadow-floating',
];

const THEMED_TOKENS = [
  '--bg',
  '--ink',
  '--ink-inverse',
  '--muted',
  '--line',
  '--accent',
  '--accent-ink',
  '--accent-contrast',
  '--surface',
  '--surface-soft',
];

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|color-mix)\(|(?<![\w-])(?:white|black)(?![\w-])/gi;
const FONT_FAMILY_LITERAL = /font-family:(?!\s*var\()/i;
const RADIUS_OR_SHADOW_LITERAL = /\b(?:border-radius|box-shadow):(?!\s*(?:var\(|none\b|inherit\b|0;))/i;
const BORDER_WIDTH_LITERAL = /\bborder(?:-top|-right|-bottom|-left)?(?:-width)?:(?!\s*(?:var\(|none\b|inherit\b|0;))/i;

const scssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      return scssFiles(path);
    }

    return path.endsWith('.scss') ? [path] : [];
  });

const read = (path: string) => readFileSync(path, 'utf8');

const tokenFiles = () => scssFiles(TOKENS_DIR);

const otherScssFiles = () => scssFiles(SRC_DIR).filter((path) => !path.startsWith(TOKENS_DIR));

const filesMatching = (pattern: RegExp) =>
  otherScssFiles()
    .filter((path) => pattern.test(read(path)))
    .map((path) => relative(SRC_DIR, path));

const declaredTokens = (source: string) => [...source.matchAll(/(--[a-z0-9-]+):/gi)].map(([, name]) => name);

const blockOf = (source: string, selector: string) => {
  const start = source.indexOf(`${selector} {`);

  if (start === -1) {
    return '';
  }

  return source.slice(start, source.indexOf('\n}', start));
};

describe('токены направлений', () => {
  it.each([...DESIGN_NAMES])('у направления %s есть свой файл токенов', (design) => {
    expect(tokenFiles().map((path) => relative(TOKENS_DIR, path))).toContain(`${design}.scss`);
  });

  it.each([...DESIGN_NAMES])('%s объявляет весь набор токенов', (design) => {
    const light = blockOf(read(join(TOKENS_DIR, `${design}.scss`)), `[data-design='${design}']`);

    expect(declaredTokens(light)).toEqual(expect.arrayContaining(REQUIRED_TOKENS));
  });

  it.each([...DESIGN_NAMES])('%s переопределяет цветовые токены в темной теме', (design) => {
    const source = read(join(TOKENS_DIR, `${design}.scss`));
    const dark = blockOf(source, `[data-design='${design}'][data-theme='dark']`);

    expect(declaredTokens(dark)).toEqual(expect.arrayContaining(THEMED_TOKENS));
  });
});

describe('SCSS вне файлов токенов', () => {
  it('не содержит цветовых литералов', () => {
    const offenders = otherScssFiles().flatMap((path) =>
      (read(path).match(COLOR_LITERAL) ?? []).map((literal) => `${relative(SRC_DIR, path)}: ${literal}`),
    );

    expect(offenders).toEqual([]);
  });

  it('задает шрифты только через var(--font-*)', () => {
    expect(filesMatching(FONT_FAMILY_LITERAL)).toEqual([]);
  });

  it('задает радиусы и тени только через var(--*)', () => {
    expect(filesMatching(RADIUS_OR_SHADOW_LITERAL)).toEqual([]);
  });

  it('задает толщину рамок только через var(--border-width*)', () => {
    expect(filesMatching(BORDER_WIDTH_LITERAL)).toEqual([]);
  });
});
