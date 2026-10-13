import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Ширина `ch` считается по глифу «0» того шрифта, что сейчас отрисован: пока грузится шрифт направления, «0»
 * fallback-начертания другой ширины → колонка текста меняет ширину и высоту при загрузке. Ширины текста — в em
 * по ширине «0» настоящего шрифта направления, единица `ch` в стилях направлений не встречается.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const STYLE_DIRS = [join(ROOT, 'src', 'designs'), join(ROOT, 'src', 'styles')];

const styleFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:scss|css)$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));

/** Число с единицей `ch`: `68ch`, `.5ch`, `1ch` в `calc(…)`; имя переменной вроде `$text-ch` — не единица. */
const CH_LENGTH = /(?<![\w.$]|\w-)(?:\d+(?:\.\d+)?|\.\d+)ch(?![\w-])/g;

const chLengths = (line: string) => line.match(CH_LENGTH) ?? [];

describe('ширины текста без единицы ch', () => {
  it('в стилях src/designs и src/styles нет длин в ch', () => {
    const offenders = STYLE_DIRS.flatMap(styleFiles).flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          chLengths(line).length > 0 ? [`${relative(ROOT, path)}:${index + 1}: ${line.trim()}`] : [],
        ),
    );

    expect(offenders).toEqual([]);
  });

  it('детектор находит длины в ch и не путает их с переменными и селекторами', () => {
    expect(chLengths('max-width: 68ch;')).toEqual(['68ch']);
    expect(chLengths('width: calc(var(--chars) * 1ch);')).toEqual(['1ch']);
    expect(chLengths('padding: 0 0 20px calc(2ch + 12px);')).toEqual(['2ch']);
    expect(chLengths('max-width: .5ch;')).toEqual(['.5ch']);

    expect(chLengths('max-width: calc(52 * $text-ch);')).toEqual([]);
    expect(chLengths('--chars: 12;')).toEqual([]);
    expect(chLengths('@include s.wrap;')).toEqual([]);
    expect(chLengths('.chip {')).toEqual([]);
  });
});
