import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import proxy from '@/proxy';
import { LABEL_REDIRECTS } from '@/lib/seo/consts';

const ORIGIN = 'https://mrshkn.com';

const request = (path: string, headers?: Record<string, string>) =>
  proxy(new NextRequest(`${ORIGIN}${path}`, { headers }));

/** Адрес из `location` без домена: путь, метки и якорь. */
const target = (location: string | null) => {
  const url = new URL(location ?? '', ORIGIN);

  return `${url.pathname}${url.search}${url.hash}`;
};

/**
 * Подписи кнопок героя Terminal — относительные адреса `./…`: поисковик разрешает их от пути страницы
 * (`/ru/docs/privacy` → `/ru/docs/как-мы-работаем`), и без редиректа такой адрес отдает 404.
 */
describe('редиректы подписей героя Terminal на любой глубине пути', () => {
  it.each([
    ['/ru/docs/как-мы-работаем', '/ru#process'],
    ['/en/docs/how-we-work', '/en#process'],
    ['/ru/docs/рассчитать-стоимость', '/ru/brief'],
    ['/en/docs/get-a-quote', '/en/brief'],
    ['/ru/work/some-case/как-мы-работаем', '/ru#process'],
    ['/ru/brief/как-мы-работаем', '/ru#process'],
    ['/en/review/x/get-a-quote', '/en/brief'],
  ])('3.1: %s → 308 на %s', (path, destination) => {
    const response = request(path);

    expect(response.status).toBe(308);
    expect(target(response.headers.get('location'))).toBe(destination);
  });

  it.each([
    ['/ru/docs/как-мы-работаем', '/ru#process'],
    ['/ru/docs/рассчитать-стоимость', '/ru/brief'],
    ['/ru/work/some-case/как-мы-работаем', '/ru#process'],
    ['/ru/brief/как-мы-работаем', '/ru#process'],
  ])('3.2: %s в процентной кодировке, как запрашивает Googlebot → 308 на %s', (path, destination) => {
    const response = request(encodeURI(path));

    expect(response.status).toBe(308);
    expect(target(response.headers.get('location'))).toBe(destination);
  });

  it('3.3: метки из адреса подписи на глубине переносятся в адрес назначения', () => {
    const response = request('/ru/docs/как-мы-работаем?utm_source=gsc');

    expect(response.status).toBe(308);
    expect(target(response.headers.get('location'))).toBe('/ru?utm_source=gsc#process');
  });

  it('3.3: метки переносятся и с адреса подписи в процентной кодировке', () => {
    const response = request(`${encodeURI('/ru/docs/рассчитать-стоимость')}?utm_source=gsc&utm_medium=organic`);

    expect(response.status).toBe(308);
    expect(target(response.headers.get('location'))).toBe('/ru/brief?utm_source=gsc&utm_medium=organic');
  });

  it.each([
    '/ru/docs/privacy',
    '/ru/docs/nope',
    '/ru/как-мы-работаем/x',
    encodeURI('/ru/как-мы-работаем/x'),
    '/ru/docs/как-мы-работаем-2',
    '/ru/docs/x-как-мы-работаем',
  ])('3.4: %s — не перенаправляется', (path) => {
    const response = request(path);

    expect(response.status).not.toBe(308);
    expect(response.headers.get('location')).toBeNull();
  });

  it('3.5: адрес глубины 2 с битой процентной кодировкой — без исключения и без редиректа подписи', () => {
    let response: ReturnType<typeof request> | undefined;

    expect(() => {
      response = request('/ru/docs/%E0%A4%A');
    }).not.toThrow();
    expect(response?.status).not.toBe(308);
    expect(Object.values(LABEL_REDIRECTS)).not.toContain(target(response?.headers.get('location') ?? null));
  });

  it.each(['/en/docs/как-мы-работаем', '/ru/docs/how-we-work'])(
    '3.6: %s — подпись чужого языка на глубине не перенаправляется',
    (path) => {
      const response = request(path);

      expect(response.status).not.toBe(308);
      expect(response.headers.get('location')).toBeNull();
    },
  );
});
