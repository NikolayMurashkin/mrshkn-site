import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLYPHS } from '../../scripts/subset-glyphs';
import { LOCALES } from '@/i18n/consts';

const charactersOf = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : Object.values(value as object)
        .map(charactersOf)
        .join('');

const messageCharacters = () =>
  new Set(LOCALES.map((locale) => charactersOf(JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')))).join(''));

describe('сабсет шрифтов Kinetic', () => {
  it('покрывает все символы переводов: знак вне сабсета отрисуется fallback-начертанием', () => {
    const subset = new Set(GLYPHS);

    expect([...messageCharacters()].filter((character) => !subset.has(character))).toEqual([]);
  });

  it('включает неразрывный пробел: он стоит после предлогов во всех заголовках', () => {
    expect(GLYPHS).toContain(' ');
  });
});
