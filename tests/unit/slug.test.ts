import { describe, expect, it } from 'vitest';
import { toSlug } from '@/cms/slug';

describe('адрес записи CMS', () => {
  it.each([
    ['Как мы делаем сайты за 14 дней', 'kak-my-delaem-sayty-za-14-dney'],
    ['Мой Пост!', 'moy-post'],
    ['  Щедрый ёжик — и чай  ', 'shchedryy-ezhik-i-chay'],
    ['Landing для клиники', 'landing-dlya-kliniki'],
    ['klinika-na-kode', 'klinika-na-kode'],
    ['---', ''],
  ])('%o → %o', (value, slug) => {
    expect(toSlug(value)).toBe(slug);
  });
});
