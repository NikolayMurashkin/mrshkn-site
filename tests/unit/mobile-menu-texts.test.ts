import { describe, expect, it } from 'vitest';
import ru from '../../messages/ru.json';

/**
 * Утвержденные подписи кнопки мобильного меню: имя бургера, пока меню закрыто, и имя крестика, пока открыто.
 * Значков без подписи скринридер не прочтет → текст нужен, хотя на экране его нет. Неразрывных пробелов в строках нет.
 * Английские строки не морозятся: их вычитывает Николай (таблица в `messages/TRANSLATION-TODO.md`).
 */
const APPROVED: [string, string][] = [
  ['header.menuOpen', 'Открыть меню'],
  ['header.menuClose', 'Закрыть меню'],
];

const valueAt = (messages: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
      messages,
    );

describe('тексты мобильного меню', () => {
  it.each(APPROVED)('T1 %s в ru.json равен утвержденному дословно', (path, text) => {
    expect(valueAt(ru, path)).toBe(text);
  });
});
