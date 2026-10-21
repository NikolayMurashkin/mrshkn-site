import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

/**
 * Договор еще не опубликован → сайт не утверждает, что условия уже «прописаны в договоре», и не ссылается
 * на документ: обещание звучит как «фиксируем в договоре».
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

describe('формулировки о договоре до его публикации', () => {
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

  it('секция обещаний не ссылается на документ', () => {
    for (const entries of [entriesOf(ru.process, 'process'), entriesOf(en.process, 'process')]) {
      expect(pathsContaining(entries, LINK_MARKS)).toEqual([]);
      expect(pathsMatching(entries, [LINK_TAG])).toEqual([]);
    }

    expect(pathsContaining(RU, ['/docs/offer'])).toEqual([]);
    expect(pathsContaining(EN, ['/docs/offer'])).toEqual([]);
  });

  it('подпись цитаты Editorial не ссылается на договор', () => {
    expect(normalize(ru.hero.editorial.quoteKicker)).toBe('Фиксируем в договоре');
    expect(normalize(en.hero.editorial.quoteKicker)).toBe('We put it in the contract');
    expect(pathsContaining(RU, ['Из договора'])).toEqual([]);
    expect(pathsContaining(EN, ['From the contract'])).toEqual([]);
  });
});
