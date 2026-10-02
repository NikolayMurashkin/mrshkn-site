import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../../src');

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);

    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

const GOOGLE_FONT_IMPORT =
  /from\s*['"]next\/font\/google['"]|import\s*\(\s*['"]next\/font\/google['"]\s*\)|require\(\s*['"]next\/font\/google['"]\s*\)/;

describe('шрифты направлений: только свои сабсеты', () => {
  it('ни один файл src/ не импортирует next/font/google: next build не ходит за шрифтами на Google', () => {
    const importers = sourceFiles(SRC)
      .filter((file) => GOOGLE_FONT_IMPORT.test(readFileSync(file, 'utf8')))
      .map((file) => file.slice(SRC.length - 3));

    expect(importers).toEqual([]);
  });
});
