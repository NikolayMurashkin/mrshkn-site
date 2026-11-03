import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

/**
 * Договор опубликован как оферта (`/docs/offer`), но ссылки на его пункты из обещаний ставятся позже, после юриста →
 * секции обещаний и героя не ссылаются на документ, а сайт не утверждает, что условия уже «прописаны в договоре»:
 * обещание звучит как «фиксируем в договоре». В текстах самих документов адрес оферты законно встречается.
 */

type Entry = { path: string; text: string };

/** Пробелы любого вида (обычный, U+00A0, U+202F) — в обычный: тексты сайта держат неразрывные пробелы. */
const normalize = (text: string) => text.replace(/\s/g, ' ');

/** Все строковые значения JSON рекурсивно, с путем ключа. */
const entriesOf = (value: unknown, path = ''): Entry[] => {
  if (typeof value === 'string') {
    return [{ path, text: normalize(value) }];
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => entriesOf(child, path === '' ? key : `${path}.${key}`));
  }

  return [];
};

const RU = entriesOf(ru);
const EN = entriesOf(en);

/** Пути строк, где сработал хотя бы один образец: в сообщении assert видно, какой ключ виноват. */
const pathsMatching = (entries: Entry[], patterns: RegExp[]) =>
  entries.filter(({ text }) => patterns.some((pattern) => pattern.test(text))).map(({ path }) => path);

const pathsContaining = (entries: Entry[], needles: string[]) =>
  entries.filter(({ text }) => needles.some((needle) => text.includes(needle))).map(({ path }) => path);

const RU_ALREADY_IN_CONTRACT = [/прописан\S*\s+в\s+договор/i, /(указан|закреплен)\S*\s+в\s+договор/i];

const EN_ALREADY_IN_CONTRACT = [/(spelled out|set out|written|stated|specified|laid down) (in|into) the contract/i];

const LINK_MARKS = ['/docs/offer', 'href'];

const LINK_TAG = /<\s*\/?\s*(a|link)\b/i;

const OFFER_PAGE = fileURLToPath(new URL('../../src/app/[locale]/docs/offer/page.tsx', import.meta.url));

/** Ветки переводов, из которых до юриста нет ссылок на договор: обещания процесса и герой. */
const PROMISE_BRANCHES = [
  ['ru', 'process', entriesOf(ru.process, 'process')],
  ['ru', 'hero', entriesOf(ru.hero, 'hero')],
  ['en', 'process', entriesOf(en.process, 'process')],
  ['en', 'hero', entriesOf(en.hero, 'hero')],
] as const;

describe('формулировки о договоре до ссылок на его пункты', () => {
  it('ru: ни одна строка не утверждает, что условия прописаны в договоре', () => {
    expect(pathsMatching(RU, RU_ALREADY_IN_CONTRACT)).toEqual([]);
  });

  it('en: ни одна строка не утверждает, что условия прописаны в договоре', () => {
    expect(pathsMatching(EN, EN_ALREADY_IN_CONTRACT)).toEqual([]);
  });

  it('секция обещаний говорит «фиксируем в договоре»', () => {
    expect(normalize(ru.process.contractNote)).toBe('Все четыре условия фиксируем в договоре');
    expect(normalize(en.process.contractNote)).toBe('We fix all four in the contract');
  });

  it('страница оферты есть', () => {
    expect(existsSync(OFFER_PAGE), OFFER_PAGE).toBe(true);
  });

  it.each(PROMISE_BRANCHES)('%s %s.*: нет href, /docs/offer и тегов <a>/<link>', (_locale, _branch, entries) => {
    expect(entries.length, 'строки ветки').toBeGreaterThan(0);
    expect(pathsContaining(entries, LINK_MARKS)).toEqual([]);
    expect(pathsMatching(entries, [LINK_TAG])).toEqual([]);
  });

  it('подпись цитаты Editorial не ссылается на договор', () => {
    expect(normalize(ru.hero.editorial.quoteKicker)).toBe('Фиксируем в договоре');
    expect(normalize(en.hero.editorial.quoteKicker)).toBe('We put it in the contract');
    expect(pathsContaining(RU, ['Из договора'])).toEqual([]);
    expect(pathsContaining(EN, ['From the contract'])).toEqual([]);
  });
});
