import { describe, expect, it } from 'vitest';
import { normalizeSiteUrl, psiUrl } from '@/lib/audit/url';

/**
 * Адрес сайта из формы «Проверьте свой сайт»: человек копирует его как придется — без схемы, с пробелами, заглавными.
 * На сервер и в ссылку на тест Google уходит один вид адреса: `https://` или `http://`, хост в нижнем регистре,
 * кириллический домен — punycode. Чужая схема и мусор — null: такой адрес не проверить и не записать в заявку.
 */

const PSI_HOME = 'https://pagespeed.web.dev/';

describe('адрес сайта из формы', () => {
  it('U1: адрес без схемы получает https и путь /', () => {
    expect(normalizeSiteUrl('example.ru')).toBe('https://example.ru/');
  });

  it('U2: пробелы по краям срезаны, хост в нижнем регистре, путь и запрос сохранены', () => {
    expect(normalizeSiteUrl('  Example.RU/menu?x=1 ')).toBe('https://example.ru/menu?x=1');
  });

  it('U3: схема http сохраняется', () => {
    expect(normalizeSiteUrl('http://example.ru')).toBe('http://example.ru/');
  });

  it('U4: готовый адрес https не меняется', () => {
    expect(normalizeSiteUrl('https://example.ru/')).toBe('https://example.ru/');
  });

  it('U5: кириллический домен — в punycode', () => {
    expect(normalizeSiteUrl('пример.рф')).toBe('https://xn--e1afmkfd.xn--p1ai/');
  });

  it.each([
    ['пусто', ''],
    ['одни пробелы', '   '],
    ['схема ftp', 'ftp://example.ru'],
    ['схема javascript', 'javascript:alert(1)'],
    ['схема mailto', 'mailto:a@example.ru'],
    ['хост без точки', 'example'],
    ['localhost с портом', 'localhost:3000'],
    ['схема без хоста', 'https://'],
    ['пробел внутри', 'exa mple.ru'],
    ['пробел в пути', 'example.ru/меню с ценами'],
    ['длиннее 2000 знаков', `a.ru/${'x'.repeat(2000)}`],
  ])('U6: %s → null', (_label, input) => {
    expect(normalizeSiteUrl(input)).toBeNull();
  });
});

describe('ссылка «Проверить самому» на PageSpeed Insights', () => {
  it('U7: ссылка несет нормализованный адрес и мобильный режим', () => {
    expect(psiUrl('example.ru')).toBe(
      'https://pagespeed.web.dev/report?url=https%3A%2F%2Fexample.ru%2F&form_factor=mobile',
    );
  });

  it.each([
    ['пустой адрес', ''],
    ['чужая схема', 'ftp://x.ru'],
  ])('U8: %s → главная PageSpeed Insights', (_label, input) => {
    expect(psiUrl(input)).toBe(PSI_HOME);
  });
});
