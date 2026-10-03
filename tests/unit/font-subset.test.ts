import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLYPHS } from '../../scripts/subset-glyphs';
import { LOCALES } from '@/i18n/consts';

type Face = { collectUnicodes: () => Uint32Array | number[]; destroy: () => void };
type HarfBuzz = {
  createBlob: (data: Uint8Array) => { destroy: () => void };
  createFace: (blob: { destroy: () => void }, index: number) => Face;
};
type Fontverter = { convert: (buffer: Buffer, to: string) => Promise<Buffer> };

const nodeRequire = createRequire(import.meta.url);
const DESIGNS = join(import.meta.dirname, '../../src/designs');

const charactersOf = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : Object.values(value as object)
        .map(charactersOf)
        .join('');

const messageCharacters = () =>
  new Set(LOCALES.map((locale) => charactersOf(JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')))).join(''));

const codePoints = (...codes: number[]) => codes.map((code) => String.fromCodePoint(code));

const NOT_IN_SOURCE = 'нет в google/fonts@e44c4b0';
const CYRILLIC_GRAVES = codePoints(0x0400, 0x040d, 0x0450, 0x045d);
const MARKS = ['✓', '✦'];

type FontFile = { path: string; missingInSource: string[]; note: string };

const FONT_FILES: FontFile[] = [
  { path: 'kinetic/fonts/unbounded.woff2', missingInSource: MARKS, note: NOT_IN_SOURCE },
  { path: 'kinetic/fonts/golos-text.woff2', missingInSource: [...CYRILLIC_GRAVES, ...MARKS], note: NOT_IN_SOURCE },
  { path: 'terminal/fonts/jetbrains-mono.woff2', missingInSource: [...CYRILLIC_GRAVES, ...MARKS], note: NOT_IN_SOURCE },
  { path: 'terminal/fonts/ibm-plex-sans.woff2', missingInSource: ['✦'], note: NOT_IN_SOURCE },
  { path: 'pop/fonts/rubik.woff2', missingInSource: ['←', '→', ...MARKS], note: NOT_IN_SOURCE },
  { path: 'swiss/fonts/geologica.woff2', missingInSource: MARKS, note: NOT_IN_SOURCE },
  {
    path: 'editorial/fonts/prata.woff2',
    missingInSource: ['…', '№', '←', '→', '≤', '≥', ...MARKS],
    note: NOT_IN_SOURCE,
  },
  {
    path: 'editorial/fonts/onest.woff2',
    missingInSource: [...codePoints(0x00ad), ...CYRILLIC_GRAVES, '✦'],
    note: NOT_IN_SOURCE,
  },
];

const fileOf = (path: string) => join(DESIGNS, path);

const designDirectories = () =>
  readdirSync(DESIGNS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const filesIn = (directory: string, extension: string) =>
  readdirSync(directory)
    .filter((name) => name.endsWith(extension))
    .map((name) => join(directory, name));

const cmapCache = new Map<string, Promise<Set<string>>>();

const fontCharacters = (path: string): Promise<Set<string>> => {
  const cached = cmapCache.get(path);

  if (cached) return cached;

  const loaded = (async () => {
    const hb = await (nodeRequire('harfbuzzjs') as Promise<HarfBuzz>);
    const fontverter = nodeRequire('fontverter') as Fontverter;
    const sfnt = await fontverter.convert(readFileSync(fileOf(path)), 'sfnt');
    const blob = hb.createBlob(new Uint8Array(sfnt));
    const face = hb.createFace(blob, 0);
    const characters = new Set([...face.collectUnicodes()].map((code) => String.fromCodePoint(code)));

    face.destroy();
    blob.destroy();

    return characters;
  })();

  cmapCache.set(path, loaded);

  return loaded;
};

const describeCharacter = (character: string) =>
  `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;

describe('сабсет шрифтов направлений', () => {
  it('покрывает все символы переводов: знак вне сабсета отрисуется fallback-начертанием', () => {
    const subset = new Set(GLYPHS);

    expect([...messageCharacters()].filter((character) => !subset.has(character))).toEqual([]);
  });

  it('включает неразрывный пробел: он стоит после предлогов во всех заголовках', () => {
    expect(GLYPHS).toContain(String.fromCodePoint(0x00a0));
  });

  describe.each(FONT_FILES)('$path', ({ path, missingInSource, note }) => {
    it(`содержит каждый знак GLYPHS, кроме знаков, которых нет в исходнике (${note})`, async () => {
      expect(existsSync(fileOf(path)), `файл ${path} существует`).toBe(true);

      const present = await fontCharacters(path);
      const excluded = new Set(missingInSource);
      const absent = [...GLYPHS].filter((character) => !excluded.has(character) && !present.has(character));

      expect(absent.map(describeCharacter)).toEqual([]);
    });

    it('не содержит знаков из списка исключений: список не прячет регрессию и не устаревает', async () => {
      expect(existsSync(fileOf(path)), `файл ${path} существует`).toBe(true);

      const present = await fontCharacters(path);

      expect(missingInSource.filter((character) => present.has(character)).map(describeCharacter)).toEqual([]);
    });

    it('лежит рядом с лицензией: <имя>-OFL.txt с текстом SIL Open Font License', () => {
      const license = fileOf(path.replace(/\.woff2$/, '-OFL.txt'));

      expect(existsSync(license), `файл ${license} существует`).toBe(true);
      expect(readFileSync(license, 'utf8').toLowerCase()).toContain('sil open font license');
    });
  });

  it('набор woff2 в src/designs/*/fonts/ равен таблице: лишний или неучтенный файл роняет тест', () => {
    const found = designDirectories()
      .filter((name) => existsSync(join(DESIGNS, name, 'fonts')))
      .flatMap((name) => filesIn(join(DESIGNS, name, 'fonts'), '.woff2'))
      .map((file) => file.slice(DESIGNS.length + 1))
      .sort();

    expect(found).toEqual(FONT_FILES.map(({ path }) => path).sort());
  });

  it('знаки из строк content: в SCSS направлений есть в GLYPHS', () => {
    const subset = new Set(GLYPHS);
    const missing = designDirectories().flatMap((name) =>
      filesIn(join(DESIGNS, name), '.module.scss').flatMap((file) =>
        [...readFileSync(file, 'utf8').matchAll(/(?<![\w-])content\s*:\s*([^;}]+)/g)]
          .flatMap(([, value]) => [...value.matchAll(/'([^']*)'|"([^"]*)"/g)].map((match) => match[1] ?? match[2]))
          .flatMap((text) => [...text])
          .filter((character) => !subset.has(character))
          .map((character) => `${name}/${file.split('/').pop()}: ${character}`),
      ),
    );

    expect([...new Set(missing)]).toEqual([]);
  });

  it('все не-ASCII знаки из tsx направлений есть в GLYPHS', () => {
    const subset = new Set(GLYPHS);
    const missing = designDirectories().flatMap((name) =>
      filesIn(join(DESIGNS, name), '.tsx').flatMap((file) =>
        [...readFileSync(file, 'utf8')]
          .filter((character) => character.charCodeAt(0) > 0x7f && !subset.has(character))
          .map((character) => `${name}/${file.split('/').pop()}: ${character}`),
      ),
    );

    expect([...new Set(missing)]).toEqual([]);
  });
});
