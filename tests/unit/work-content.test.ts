import { describe, expect, it } from 'vitest';
import { excerpt, splitParagraphs } from '@/content/work';

describe('абзацы текста кейса', () => {
  it('делятся по пустой строке, в том числе с пробелами в ней; лишние пустые строки отбрасываются', () => {
    expect(splitParagraphs('Первый абзац\nпродолжение\n \t\n  Второй  \n\n\n\nТретий\n\n')).toEqual([
      'Первый абзац\nпродолжение',
      'Второй',
      'Третий',
    ]);
  });

  it('пустой текст — ни одного абзаца', () => {
    expect(splitParagraphs('')).toEqual([]);
    expect(splitParagraphs(' \n\n ')).toEqual([]);
  });
});

describe('описание страницы кейса', () => {
  it('короткий текст отдается целиком, с переносами, схлопнутыми в пробел', () => {
    expect(excerpt('Задача\n\nв два  абзаца', 40)).toBe('Задача в два абзаца');
  });

  it('длинный текст режется по границе слова и кончается многоточием в пределах лимита', () => {
    const result = excerpt('Запустить лендинг клиники за две недели', 20);

    expect(result).toBe('Запустить лендинг…');
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('слово длиннее лимита режется посередине', () => {
    expect(excerpt('Сверхдлинноеслово', 8)).toBe('Сверхдл…');
  });
});
