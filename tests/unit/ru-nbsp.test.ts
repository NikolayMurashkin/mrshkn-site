import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Короткий предлог или союз не остается в конце строки: после него в русских текстах неразрывный пробел (U+00A0),
 * как требуют соглашения сайта. Список — предлоги и союзы до двух букв.
 */

const RU_MESSAGES = fileURLToPath(new URL('../../messages/ru.json', import.meta.url));

const SHORT_WORDS = 'а в и к о с у во ко со об на но по за из от до'.split(' ');

/** Целое слово из списка (перед ним не буква, не цифра и не дефис) и сразу за ним обычный пробел. */
const SHORT_WORD_THEN_SPACE = new RegExp(`(?<![\\p{L}\\p{N}-])(?:${SHORT_WORDS.join('|')}) `, 'giu');

const CONTEXT = 12;

const ordinarySpacesAfterShortWords = (text: string) =>
  [...text.matchAll(SHORT_WORD_THEN_SPACE)].map((match) => {
    const start = Math.max(0, match.index - CONTEXT);
    const end = match.index + match[0].length + CONTEXT;

    return `«…${text.slice(start, end)}…»`;
  });

const strings = (value: unknown, path: string): { path: string; text: string }[] => {
  if (typeof value === 'string') {
    return [{ path, text: value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => strings(item, path ? `${path}.${key}` : key));
  }

  return [];
};

describe('неразрывные пробелы в ru.json', () => {
  it('после коротких предлогов и союзов нет обычного пробела', () => {
    const messages: unknown = JSON.parse(readFileSync(RU_MESSAGES, 'utf8'));
    const offenders = strings(messages, '').flatMap(({ path, text }) =>
      ordinarySpacesAfterShortWords(text).map((fragment) => `${path}: ${fragment}`),
    );

    expect(offenders).toEqual([]);
  });

  it('детектор находит обычный пробел после короткого слова и не трогает части слов', () => {
    expect(ordinarySpacesAfterShortWords('хостинг на вашем')).toHaveLength(1);
    expect(ordinarySpacesAfterShortWords('И зависимостей')).toHaveLength(1);
    expect(ordinarySpacesAfterShortWords('«в срок»')).toHaveLength(1);
    expect(ordinarySpacesAfterShortWords('— за две')).toHaveLength(1);

    expect(ordinarySpacesAfterShortWords('на вашем')).toEqual([]);
    expect(ordinarySpacesAfterShortWords('Назад')).toEqual([]);
    expect(ordinarySpacesAfterShortWords('сайт-на коде')).toEqual([]);
    expect(ordinarySpacesAfterShortWords('Telegram и MAX')).toEqual([]);
    expect(ordinarySpacesAfterShortWords('Telegram и')).toEqual([]);
  });
});
