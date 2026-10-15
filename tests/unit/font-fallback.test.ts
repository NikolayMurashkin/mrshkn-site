import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Метрические fallback-начертания Kinetic, Terminal, Editorial и Swiss (у Swiss — и ru-грани, и английские): пока `.woff2` не загрузился, текст первого экрана
 * рисуется гранями `'<Family> Metric Fallback'` и не должен менять высоту при подмене шрифта. Стандарт:
 * жирный — своя грань на жирных `local()`, кириллица и латиница — разные грани
 * по `unicode-range`, английские страницы — свое семейство `… Metric Fallback En` через `:lang(en)`.
 * Значения калибровки (`size-adjust`, границы весов) дает замер на сборке — тест их не предполагает и проверяет форму
 * и инварианты, которые замер не ловит: метрики граней против метрик самого шрифта, отсутствие перекрытий граней,
 * объявленность семейств из стеков.
 */

type Range = [number, number];
type SrcEntry = { local: string } | { other: string };

type FontFace = {
  family: string;
  src: SrcEntry[];
  weight: Range | null;
  unicodeRange: Range[] | null;
  ascent: number | null;
  descent: number | null;
  lineGap: number | null;
  sizeAdjust: number | null;
};

type Rule = { selectors: string[]; declarations: Map<string, string> };
type Stylesheet = { faces: FontFace[]; rules: Rule[] };

type Fontverter = { convert: (buffer: Buffer, to: string) => Promise<Buffer> };

const ROOT = join(import.meta.dirname, '../..');
const DESIGNS = ['kinetic', 'terminal', 'editorial', 'swiss'] as const;

type Design = (typeof DESIGNS)[number];

const nodeRequire = createRequire(import.meta.url);

const CYRILLIC_A = 0x0410;
const LATIN_A = 0x0041;
const METRIC_FALLBACK = 'Metric Fallback';
const TOLERANCE_EM = 0.005;

const stripComments = (source: string) => {
  let result = '';
  let quote: string | null = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      result += character;
      if (character === '\\') {
        result += source[index + 1] ?? '';
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      result += character;
    } else if (character === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);

      index = end === -1 ? source.length : end + 1;
      result += ' ';
    } else if (character === '/' && source[index + 1] === '/') {
      const end = source.indexOf('\n', index + 2);

      index = end === -1 ? source.length : end - 1;
    } else {
      result += character;
    }
  }

  return result;
};

/** Делит по разделителю вне кавычек, скобок и вложенных блоков. */
const splitTopLevel = (source: string, separator: string) => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;

  for (const character of source) {
    if (quote) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }

    if (character === "'" || character === '"') quote = character;
    else if (character === '(' || character === '{') depth += 1;
    else if (character === ')' || character === '}') depth -= 1;

    if (character === separator && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  parts.push(current);

  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
};

/** Блоки верхнего уровня: `{ prelude, body }`; инструкции `…;` вне блоков пропускаются. */
const topLevelBlocks = (source: string) => {
  const blocks: { prelude: string; body: string }[] = [];
  let prelude = '';
  let body = '';
  let depth = 0;
  let quote: string | null = null;

  for (const character of source) {
    if (quote) {
      if (depth === 0) prelude += character;
      else body += character;
      if (character === quote) quote = null;
      continue;
    }

    if (character === "'" || character === '"') quote = character;

    if (character === '{') {
      depth += 1;
      if (depth === 1) continue;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        blocks.push({ prelude: prelude.trim(), body });
        prelude = '';
        body = '';
        continue;
      }
    } else if (character === ';' && depth === 0) {
      prelude = '';
      continue;
    }

    if (depth === 0) prelude += character;
    else body += character;
  }

  return blocks;
};

const declarationsOf = (body: string) =>
  new Map(
    splitTopLevel(body, ';')
      .filter((declaration) => !declaration.includes('{'))
      .flatMap((declaration) => {
        const colon = declaration.indexOf(':');

        if (colon === -1) return [];

        const value = declaration
          .slice(colon + 1)
          .replace(/!important\s*$/, '')
          .replace(/\s+/g, ' ')
          .trim();

        return [[declaration.slice(0, colon).trim().toLowerCase(), value] as const];
      }),
  );

const unquote = (value: string) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

const familiesOf = (value: string) => splitTopLevel(value, ',').map(unquote);

const percentOf = (value: string | undefined) => {
  if (value === undefined) return null;

  const match = /^(-?\d+(?:\.\d+)?|-?\.\d+)%$/.exec(value.trim());

  return match ? Number(`${match[1]}e-2`) : Number.NaN;
};

const WEIGHT_KEYWORDS: Record<string, number> = { normal: 400, bold: 700 };

const weightOf = (value: string | undefined): Range | null => {
  if (value === undefined) return null;

  const numbers = value
    .trim()
    .split(/\s+/)
    .map((token) => WEIGHT_KEYWORDS[token.toLowerCase()] ?? Number(token));

  return [numbers[0], numbers[numbers.length - 1]];
};

const unicodeRangeOf = (value: string | undefined): Range[] | null => {
  if (value === undefined) return null;

  return splitTopLevel(value, ',').map((token) => {
    const [from, to] = token.replace(/^u\+/i, '').split('-');

    if (to !== undefined) return [parseInt(from, 16), parseInt(to, 16)];

    return [parseInt(from.replace(/\?/g, '0'), 16), parseInt(from.replace(/\?/g, 'F'), 16)];
  });
};

const srcOf = (value: string | undefined): SrcEntry[] =>
  value === undefined
    ? []
    : splitTopLevel(value, ',').map((entry) => {
        const local = /^local\(\s*(.+?)\s*\)$/i.exec(entry);

        return local ? { local: unquote(local[1]) } : { other: entry };
      });

const faceOf = (body: string): FontFace => {
  const declarations = declarationsOf(body);

  return {
    family: unquote(declarations.get('font-family') ?? ''),
    src: srcOf(declarations.get('src')),
    weight: weightOf(declarations.get('font-weight')),
    unicodeRange: unicodeRangeOf(declarations.get('unicode-range')),
    ascent: percentOf(declarations.get('ascent-override')),
    descent: percentOf(declarations.get('descent-override')),
    lineGap: percentOf(declarations.get('line-gap-override')),
    sizeAdjust: percentOf(declarations.get('size-adjust')),
  };
};

const normalizeSelector = (selector: string) =>
  selector
    .replace(/\s+/g, '')
    .replace(/"/g, "'")
    .replace(/\[data-design=([\w-]+)\]/g, "[data-design='$1']");

const parseStylesheet = (source: string): Stylesheet => {
  const blocks = topLevelBlocks(stripComments(source));

  return {
    faces: blocks.filter(({ prelude }) => /^@font-face$/i.test(prelude)).map(({ body }) => faceOf(body)),
    rules: blocks
      .filter(({ prelude }) => !prelude.startsWith('@'))
      .map(({ prelude, body }) => ({
        selectors: splitTopLevel(prelude, ',').map(normalizeSelector),
        declarations: declarationsOf(body),
      })),
  };
};

const baseSelectors = (design: string) => [`[data-design='${design}']`];
const enSelectors = (design: string) => [`[data-design='${design}']:lang(en)`, `:lang(en)[data-design='${design}']`];

/** Переменные правила с одним из селекторов; несколько таких правил сливаются по порядку в файле. */
const variablesOf = (sheet: Stylesheet, selectors: string[]) => {
  const matching = sheet.rules.filter((rule) => rule.selectors.some((selector) => selectors.includes(selector)));

  if (matching.length === 0) return null;

  return new Map(matching.flatMap((rule) => [...rule.declarations]));
};

const fitsWeight = (face: FontFace, weight: number) =>
  face.weight === null || (face.weight[0] <= weight && weight <= face.weight[1]);

const draws = (face: FontFace, codePoint: number) =>
  face.unicodeRange === null || face.unicodeRange.some(([from, to]) => from <= codePoint && codePoint <= to);

const rangesIntersect = (a: Range[] | null, b: Range[] | null) =>
  a === null || b === null || a.some(([aFrom, aTo]) => b.some(([bFrom, bTo]) => aFrom <= bTo && bFrom <= aTo));

const weightsIntersect = (a: Range | null, b: Range | null) =>
  a === null || b === null || (a[0] <= b[1] && b[0] <= a[1]);

const describeWeight = (weight: Range | null) =>
  weight === null ? 'все веса' : weight[0] === weight[1] ? `${weight[0]}` : `${weight[0]}–${weight[1]}`;

const describeScript = (face: FontFace) => {
  if (face.unicodeRange === null) return 'без unicode-range';
  if (draws(face, CYRILLIC_A) && !draws(face, LATIN_A)) return 'кириллица';
  if (draws(face, LATIN_A) && !draws(face, CYRILLIC_A)) return 'латиница';

  return face.unicodeRange.map(([from, to]) => `U+${from.toString(16)}-${to.toString(16)}`).join(', ');
};

const describeSrc = (entry: SrcEntry) => ('local' in entry ? `local(${entry.local})` : entry.other);

const sheets = Object.fromEntries(
  DESIGNS.map((design) => [
    design,
    parseStylesheet(readFileSync(join(ROOT, 'src/styles/designs', `${design}.scss`), 'utf8')),
  ]),
) as Record<Design, Stylesheet>;

const facesOf = (design: Design, family: string) => sheets[design].faces.filter((face) => face.family === family);

/** Настоящий шрифт грани: `'Golos Text Metric Fallback En'` → `src/designs/kinetic/fonts/golos-text.woff2`. */
const fontFileOf = (design: Design, family: string) => {
  const base = family.replace(/ Metric Fallback(?: En)?$/, '');

  return join(ROOT, 'src/designs', design, 'fonts', `${base.toLowerCase().replace(/\s+/g, '-')}.woff2`);
};

type VerticalMetrics = { ascender: number; descender: number; unitsPerEm: number };

const metricsCache = new Map<string, Promise<VerticalMetrics>>();

/** `ascender`/`descender` из `hhea` — их берет next/font; у шрифтов сайта `OS/2` typo (USE_TYPO_METRICS) те же. */
const verticalMetricsOf = (path: string) => {
  const cached = metricsCache.get(path);

  if (cached) return cached;

  const loaded = (async () => {
    const fontverter = nodeRequire('fontverter') as Fontverter;
    const sfnt = await fontverter.convert(readFileSync(path), 'sfnt');
    const tables = new Map(
      Array.from({ length: sfnt.readUInt16BE(4) }, (_, index) => {
        const record = 12 + index * 16;

        return [sfnt.toString('latin1', record, record + 4), sfnt.readUInt32BE(record + 8)] as const;
      }),
    );
    const head = tables.get('head')!;
    const hhea = tables.get('hhea')!;

    return {
      unitsPerEm: sfnt.readUInt16BE(head + 18),
      ascender: sfnt.readInt16BE(hhea + 4),
      descender: sfnt.readInt16BE(hhea + 6),
    };
  })();

  metricsCache.set(path, loaded);

  return loaded;
};

describe('разбор @font-face и переменных шрифта в файлах токенов', () => {
  it('разбор находит грани, их поля и переопределение :lang(en)', () => {
    const sheet = parseStylesheet(`
@font-face {
  font-family: 'Unbounded Metric Fallback';
  src:
    local('Arial Bold'),
    local("Arial-BoldMT"),
    local('Liberation Sans Bold');
  font-weight: 650 849;
  ascent-override: 73.5%;
  descent-override: 18.1%;
  line-gap-override: 0%;
  size-adjust: 135.4%;
  unicode-range: U+0400-052F, U+2116;
}

/* латиница: { без диапазона } */

@font-face {
  font-family: "Unbounded Metric Fallback";
  src: local('Arial Black');
  font-weight: 700;
  ascent-override: 80%;
  descent-override: 20%;
  line-gap-override: 0%;
  size-adjust: 124.4%;
}

[data-design="kinetic"]:lang(en) {
  --font-display: 'Unbounded', 'Unbounded Metric Fallback En', sans-serif;
}
`);

    expect(sheet.faces).toEqual([
      {
        family: 'Unbounded Metric Fallback',
        src: [{ local: 'Arial Bold' }, { local: 'Arial-BoldMT' }, { local: 'Liberation Sans Bold' }],
        weight: [650, 849],
        unicodeRange: [
          [0x0400, 0x052f],
          [0x2116, 0x2116],
        ],
        ascent: 0.735,
        descent: 0.181,
        lineGap: 0,
        sizeAdjust: 1.354,
      },
      {
        family: 'Unbounded Metric Fallback',
        src: [{ local: 'Arial Black' }],
        weight: [700, 700],
        unicodeRange: null,
        ascent: 0.8,
        descent: 0.2,
        lineGap: 0,
        sizeAdjust: 1.244,
      },
    ]);

    const en = variablesOf(sheet, enSelectors('kinetic'));

    expect(en?.get('--font-display') === undefined ? null : familiesOf(en.get('--font-display')!)).toEqual([
      'Unbounded',
      'Unbounded Metric Fallback En',
      'sans-serif',
    ]);
  });
});

describe('жирный — своя грань на жирных local()', () => {
  it.each([
    { design: 'kinetic' as const, family: 'Unbounded Metric Fallback', weight: 900 },
    { design: 'terminal' as const, family: 'Terminal Sans Metric Fallback', weight: 700 },
  ])('$design: $family $weight рисует своя жирная грань', ({ design, family, weight }) => {
    const faces = facesOf(design, family).filter((face) => fitsWeight(face, weight));
    const violations = faces.flatMap((face) => {
      const problems = [
        ...(face.weight === null ? ['нет font-weight'] : []),
        ...face.src
          .filter((entry) => !('local' in entry) || !/Bold|Black/.test(entry.local))
          .map((entry) => `src ${describeSrc(entry)} — не жирное local()`),
      ];

      return problems.length > 0 ? [`грань ${describeWeight(face.weight)} ${describeScript(face)}: ${problems}`] : [];
    });

    expect(faces.length, `${family}: грани под вес ${weight}`).toBeGreaterThan(0);
    expect(violations, `${family} ${weight}`).toEqual([]);
  });
});

describe('кириллица и латиница — разные грани', () => {
  it.each([
    { design: 'kinetic' as const, family: 'Unbounded Metric Fallback', weight: 900 },
    { design: 'kinetic' as const, family: 'Golos Text Metric Fallback', weight: 400 },
    { design: 'terminal' as const, family: 'Terminal Sans Metric Fallback', weight: 700 },
    { design: 'editorial' as const, family: 'Onest Metric Fallback', weight: 400 },
    { design: 'editorial' as const, family: 'Prata Metric Fallback', weight: 400 },
  ])('$design: $family $weight — кириллица и латиница разными гранями', ({ design, family, weight }) => {
    const faces = facesOf(design, family).filter((face) => fitsWeight(face, weight));
    const cyrillicOnly = faces.filter((face) => draws(face, CYRILLIC_A) && !draws(face, LATIN_A));
    const latinOrUnranged = faces.filter(
      (face) => face.unicodeRange === null || (draws(face, LATIN_A) && !draws(face, CYRILLIC_A)),
    );
    const rangedBoth = faces.filter(
      (face) => face.unicodeRange !== null && draws(face, CYRILLIC_A) && draws(face, LATIN_A),
    );

    expect(
      { cyrillicOnly: cyrillicOnly.length, latinOrUnranged: latinOrUnranged.length, rangedBoth: rangedBoth.length },
      `${family} ${weight}: грани ${faces.map((face) => describeScript(face)).join(' | ') || 'не найдены'}`,
    ).toEqual({ cyrillicOnly: 1, latinOrUnranged: 1, rangedBoth: 0 });
  });
});

describe('английский — свое семейство через :lang(en)', () => {
  it.each([
    { design: 'kinetic' as const, variable: '--font-display' },
    { design: 'kinetic' as const, variable: '--font-text' },
    { design: 'terminal' as const, variable: '--font-text' },
    { design: 'editorial' as const, variable: '--font-text' },
    { design: 'swiss' as const, variable: '--font-display' },
    { design: 'swiss' as const, variable: '--font-text' },
  ])('$design: $variable на /en — семейство Metric Fallback En', ({ design, variable }) => {
    const sheet = sheets[design];
    const base = variablesOf(sheet, baseSelectors(design))?.get(variable);
    const en = variablesOf(sheet, enSelectors(design));

    expect(base, `${variable} в [data-design='${design}']`).toBeDefined();
    expect(en, `правило [data-design='${design}']:lang(en)`).not.toBeNull();
    expect(en?.get(variable), `${variable} в :lang(en)`).toBeDefined();

    const family = familiesOf(base!)[0];
    const enStack = familiesOf(en!.get(variable)!);
    const enFamily = `${family} Metric Fallback En`;
    const enFaces = facesOf(design, enFamily);

    expect(enStack.slice(0, 2)).toEqual([family, enFamily]);
    expect(enFaces.length, `грани ${enFamily} объявлены`).toBeGreaterThan(0);
    expect(
      enFaces.filter((face) => face.unicodeRange !== null).map((face) => describeWeight(face.weight)),
      `грани ${enFamily} с unicode-range`,
    ).toEqual([]);
  });
});

type FaceRow = { design: Design; face: FontFace | null; title: string };

const fallbackFaceRows = DESIGNS.flatMap((design): FaceRow[] => {
  const faces = sheets[design].faces.filter((face) => face.family.includes(METRIC_FALLBACK));

  if (faces.length === 0) return [{ design, face: null, title: `грани ${METRIC_FALLBACK} не найдены` }];

  return faces.map((face) => ({
    design,
    face,
    title: `${face.family} ${describeWeight(face.weight)} ${describeScript(face)}`,
  }));
});

describe('метрики граней сходятся со шрифтом', () => {
  it.each(fallbackFaceRows)(
    '$design: $title — ascent/descent = метрики шрифта ÷ size-adjust',
    async ({ design, face }) => {
      expect(face, `${design}: грани ${METRIC_FALLBACK} найдены`).not.toBeNull();

      const path = fontFileOf(design, face!.family);

      expect(existsSync(path), `шрифт ${path}`).toBe(true);

      const { ascender, descender, unitsPerEm } = await verticalMetricsOf(path);
      const sizeAdjust = face!.sizeAdjust ?? 1;

      expect(face!.ascent, 'ascent-override задан').not.toBeNull();
      expect(face!.descent, 'descent-override задан').not.toBeNull();
      expect(
        Math.abs(face!.ascent! * sizeAdjust - ascender / unitsPerEm),
        `ascent ${face!.ascent} × size-adjust ${sizeAdjust} против ${ascender / unitsPerEm} em`,
      ).toBeLessThanOrEqual(TOLERANCE_EM);
      expect(
        Math.abs(face!.descent! * sizeAdjust - Math.abs(descender) / unitsPerEm),
        `descent ${face!.descent} × size-adjust ${sizeAdjust} против ${Math.abs(descender) / unitsPerEm} em`,
      ).toBeLessThanOrEqual(TOLERANCE_EM);
      expect(face!.lineGap, 'line-gap-override').toBe(0);
    },
  );
});

type FamilyRow = { design: Design; family: string | null };

const familyRows = DESIGNS.flatMap((design): FamilyRow[] => {
  const families = [...new Set(sheets[design].faces.map((face) => face.family))];

  return families.length === 0 ? [{ design, family: null }] : families.map((family) => ({ design, family }));
});

describe('грани одного семейства не перекрываются', () => {
  /**
   * Пара граней с общим весом и общими символами допустима в одном виде — составное начертание: ранняя грань
   * без `unicode-range`, поздняя — с ним. Браузер проверяет грани с одинаковыми дескрипторами от последней
   * к первой, поэтому символы диапазона берет поздняя грань, остальные — ранняя. Любое другое перекрытие отдает
   * выбор грани порядку правил или случаю.
   */
  it.each(familyRows)('$design: грани $family не перекрываются', ({ design, family }) => {
    expect(family, `${design}: семейства @font-face найдены`).not.toBeNull();

    const faces = facesOf(design, family!);

    expect(faces.length).toBeGreaterThan(0);

    const overlaps = faces.flatMap((earlier, index) =>
      faces
        .slice(index + 1)
        .filter(
          (later) =>
            weightsIntersect(earlier.weight, later.weight) &&
            rangesIntersect(earlier.unicodeRange, later.unicodeRange) &&
            !(earlier.unicodeRange === null && later.unicodeRange !== null),
        )
        .map(
          (later) =>
            `${describeWeight(earlier.weight)} ${describeScript(earlier)} ↔ ${describeWeight(later.weight)} ${describeScript(later)}`,
        ),
    );

    expect(overlaps).toEqual([]);
  });
});

describe('стеки ссылаются на объявленные семейства', () => {
  it.each(DESIGNS)('%s: семейства Metric Fallback в стеках объявлены', (design) => {
    const sheet = sheets[design];
    const stacks = [variablesOf(sheet, baseSelectors(design)), variablesOf(sheet, enSelectors(design))].flatMap(
      (variables) => ['--font-display', '--font-text'].flatMap((name) => variables?.get(name) ?? []),
    );
    const referenced = [...new Set(stacks.flatMap(familiesOf).filter((family) => family.includes(METRIC_FALLBACK)))];
    const declared = new Set(sheet.faces.map((face) => face.family));

    expect(referenced.length, `${design}: семейства ${METRIC_FALLBACK} в стеках`).toBeGreaterThan(0);
    expect(referenced.filter((family) => !declared.has(family))).toEqual([]);
  });
});
