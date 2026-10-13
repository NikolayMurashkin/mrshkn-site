import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Текст из CMS и с бэкенда переносится внутри контейнера: `word-wrap` — алиас `overflow-wrap`, поэтому из пары
 * действует последняя декларация. `break-word` не входит в min-content → длинное слово раздвигает flex/grid-ребенка
 * и ячейку таблицы; `anywhere` входит. Каждое правило с декларацией переноса кончается на `overflow-wrap: anywhere`.
 * «Правило» — декларации одного уровня внутри одних фигурных скобок; вложенный блок — отдельное правило.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SKIPPED_DIRS = new Set(['node_modules', 'public', 'playwright-report', 'test-results']);

type Declaration = { property: string; value: string; line: number };

type Rule = { selector: string; line: number; declarations: Declaration[] };

const styleFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name.startsWith('.') || SKIPPED_DIRS.has(entry.name) ? [] : styleFiles(path);
    }

    return /\.(?:scss|css)$/.test(entry.name) ? [path] : [];
  });

/** Комментарии заменяются пробелами той же длины с сохранением переводов строк → номера строк не сдвигаются. */
const stripComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
    .replace(
      /(^|[\s;{}])\/\/[^\n]*/g,
      (comment, before: string) => before + ' '.repeat(comment.length - before.length),
    );

/** Правила файла: декларации каждого уровня скобок отдельно, `#{…}` интерполяции — часть текста. */
const parseRules = (source: string): Rule[] => {
  const text = stripComments(source);
  const rules: Rule[] = [];
  const stack: Rule[] = [{ selector: '', line: 1, declarations: [] }];
  let chunk = '';
  let chunkLine = 1;
  let line = 1;

  const flush = () => {
    const declaration = chunk.trim().match(/^([\w-]+)\s*:\s*([\s\S]+?)\s*$/);

    if (declaration) {
      stack[stack.length - 1].declarations.push({
        property: declaration[1].toLowerCase(),
        value: declaration[2].toLowerCase(),
        line: chunkLine,
      });
    }

    chunk = '';
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '#' && text[index + 1] === '{') {
      const end = text.indexOf('}', index);

      chunk += text.slice(index, end + 1);
      line += text.slice(index, end + 1).split('\n').length - 1;
      index = end;
      continue;
    }

    if (!chunk.trim() && char !== '\n') {
      chunkLine = line;
    }

    if (char === '{') {
      stack.push({ selector: chunk.trim(), line: chunkLine, declarations: [] });
      chunk = '';
    } else if (char === '}') {
      flush();

      const rule = stack.pop();

      if (rule) {
        rules.push(rule);
      }
    } else if (char === ';') {
      flush();
    } else {
      chunk += char;
    }

    if (char === '\n') {
      line += 1;
    }
  }

  flush();
  rules.push(...stack);

  return rules;
};

const WRAP_PROPERTIES = ['word-wrap', 'overflow-wrap'];

const wrapDeclarations = (rule: Rule) =>
  rule.declarations.filter((declaration) => WRAP_PROPERTIES.includes(declaration.property));

const isAnywhere = (declaration: Declaration) =>
  declaration.property === 'overflow-wrap' && /^anywhere(?:\s*!important)?$/.test(declaration.value);

const isBreakWord = (declaration: Declaration) => /^break-word(?:\s*!important)?$/.test(declaration.value);

/** Пары, где `overflow-wrap: anywhere` стоит раньше `break-word` того же правила. */
const lateBreakWords = (source: string) =>
  parseRules(source).flatMap((rule) => {
    const wraps = wrapDeclarations(rule);

    return wraps.flatMap((first, index) =>
      isAnywhere(first)
        ? wraps
            .slice(index + 1)
            .filter(isBreakWord)
            .map((later) => `${first.line} anywhere → ${later.line} break-word`)
        : [],
    );
  });

/** Правила, где последняя декларация переноса — не `overflow-wrap: anywhere`. */
const wrongLastWraps = (source: string) =>
  parseRules(source).flatMap((rule) => {
    const last = wrapDeclarations(rule).at(-1);

    return last && !isAnywhere(last) ? [`${last.line}: ${last.property}: ${last.value}`] : [];
  });

const offendersInRepo = (check: (source: string) => string[]) =>
  styleFiles(ROOT).flatMap((path) =>
    check(readFileSync(path, 'utf8')).map((found) => `${relative(ROOT, path)}:${found}`),
  );

describe('порядок word-wrap и overflow-wrap', () => {
  it('ни в одном правиле overflow-wrap: anywhere не стоит раньше break-word', () => {
    expect(offendersInRepo(lateBreakWords)).toEqual([]);
  });

  it('каждое правило с декларацией переноса кончается на overflow-wrap: anywhere', () => {
    expect(offendersInRepo(wrongLastWraps)).toEqual([]);
  });

  it('миксин title направления Swiss кончается на overflow-wrap: anywhere', () => {
    const source = readFileSync(join(ROOT, 'src', 'designs', 'swiss', '_shared.scss'), 'utf8');
    const title = parseRules(source).find((rule) => /^@mixin\s+title\b/.test(rule.selector));
    const last = title ? wrapDeclarations(title).at(-1) : undefined;

    expect(title?.selector).toMatch(/^@mixin\s+title\b/);
    expect(last && `${last.property}: ${last.value}`).toBe('overflow-wrap: anywhere');
  });

  it('разбор правил находит неверный порядок и отличает вложенные правила', () => {
    const wrong = '.a { overflow-wrap: anywhere; word-wrap: break-word; }';
    const right = '.a { word-wrap: break-word; overflow-wrap: anywhere; }';
    const nested = '.a { overflow-wrap: anywhere; .b { word-wrap: break-word; overflow-wrap: anywhere; } }';
    const breakWordOnly = '.a { overflow-wrap: break-word; }';
    const mixin = '@mixin m { overflow-wrap: anywhere; overflow-wrap: break-word; }';
    const unrelated = '.a { color: red; }';

    expect(lateBreakWords(wrong)).toEqual(['1 anywhere → 1 break-word']);
    expect(wrongLastWraps(wrong)).toEqual(['1: word-wrap: break-word']);

    expect(lateBreakWords(right)).toEqual([]);
    expect(wrongLastWraps(right)).toEqual([]);

    expect(lateBreakWords(nested)).toEqual([]);
    expect(wrongLastWraps(nested)).toEqual([]);

    expect(wrongLastWraps(breakWordOnly)).toEqual(['1: overflow-wrap: break-word']);

    expect(lateBreakWords(mixin)).toEqual(['1 anywhere → 1 break-word']);
    expect(wrongLastWraps(mixin)).toEqual(['1: overflow-wrap: break-word']);

    expect(lateBreakWords(unrelated)).toEqual([]);
    expect(wrongLastWraps(unrelated)).toEqual([]);
  });
});
