import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import proxy from '@/proxy';
import { LABEL_REDIRECTS } from '@/lib/seo/consts';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

const ORIGIN = 'https://mrshkn.com';

/** Подписи кнопок героя Terminal похожи на адреса — поисковики их берут, и без редиректа они отдают 404. */
const EXPECTED_REDIRECTS: Record<string, string> = {
  '/ru/рассчитать-стоимость': '/ru/brief',
  '/en/get-a-quote': '/en/brief',
  '/ru/как-мы-работаем': '/ru#process',
  '/en/how-we-work': '/en#process',
  '/рассчитать-стоимость': '/ru/brief',
  '/как-мы-работаем': '/ru#process',
  '/get-a-quote': '/en/brief',
  '/how-we-work': '/en#process',
};

const request = (path: string, headers?: Record<string, string>) =>
  proxy(new NextRequest(`${ORIGIN}${path}`, { headers }));

/** Адрес из `location` без домена: путь, метки и якорь. */
const target = (location: string | null) => {
  const url = new URL(location ?? '', ORIGIN);

  return `${url.pathname}${url.search}${url.hash}`;
};

/** Все строки объекта сообщений с путем ключа, рекурсивно, включая массивы. */
const collectStrings = (value: unknown, path = ''): { path: string; value: string }[] => {
  if (typeof value === 'string') {
    return [{ path, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => collectStrings(item, path ? `${path}.${key}` : key));
  }

  return [];
};

const pathLabels = (messages: unknown) => collectStrings(messages).filter(({ value }) => value.startsWith('./'));

describe('редиректы подписей героя Terminal', () => {
  it.each([
    ['1.1', '/ru/рассчитать-стоимость', '/ru/brief'],
    ['1.2', '/en/get-a-quote', '/en/brief'],
    ['1.3', '/ru/как-мы-работаем', '/ru#process'],
    ['1.4', '/en/how-we-work', '/en#process'],
  ])('%s: %s → 308 на %s', (_, path, destination) => {
    const response = request(path);

    expect(response.status).toBe(308);
    expect(target(response.headers.get('location'))).toBe(destination);
  });

  it.each([
    ['/ru/рассчитать-стоимость', '/ru/brief'],
    ['/ru/как-мы-работаем', '/ru#process'],
  ])('1.5: %s в процентной кодировке, как запрашивает Googlebot → 308 на %s', (path, destination) => {
    const response = request(encodeURI(path));

    expect(response.status).toBe(308);
    expect(target(response.headers.get('location'))).toBe(destination);
  });

  it.each(['/ru/nope', '/ru/brief', '/en/как-мы-работаем'])('1.6: %s вне списка — не перенаправляется', (path) => {
    const response = request(path);

    expect(response.status).not.toBe(308);
    expect(response.headers.get('location')).toBeNull();
  });

  it('1.7: метки из адреса подписи переносятся в адрес назначения', () => {
    const response = request('/ru/как-мы-работаем?utm_source=gsc');

    expect(response.status).toBe(308);
    expect(target(response.headers.get('location'))).toBe('/ru?utm_source=gsc#process');
  });

  it('1.8: список редиректов — ровно восемь пар: с языком и без', () => {
    expect(LABEL_REDIRECTS).toEqual(EXPECTED_REDIRECTS);
  });

  it.each([
    ['/рассчитать-стоимость', 'en-US', '/ru/brief'],
    ['/как-мы-работаем', 'en-US', '/ru#process'],
    ['/get-a-quote', 'ru-RU', '/en/brief'],
    ['/how-we-work', 'ru-RU', '/en#process'],
  ])(
    '1.9: %s без языка при Accept-Language %s → один 308 сразу на %s, язык — по подписи',
    (path, acceptLanguage, destination) => {
      const response = request(path, { 'accept-language': acceptLanguage });

      expect(response.status).toBe(308);
      expect(target(response.headers.get('location'))).toBe(destination);
    },
  );

  it('1.10: /nope без языка — ответ next-intl как раньше, не адрес из списка', () => {
    const response = request('/nope');
    const location = response.headers.get('location');

    expect(Object.values(EXPECTED_REDIRECTS)).not.toContain(target(location));
    expect(new URL(location ?? '', ORIGIN).pathname).toBe('/ru/nope');
  });

  it('1.11: адрес с битой процентной кодировкой — без исключения и без редиректа подписи', () => {
    const response = request('/ru/%E0%A4%A');

    expect(response.status).not.toBe(308);
    expect(Object.values(EXPECTED_REDIRECTS)).not.toContain(target(response.headers.get('location')));
  });
});

describe('подписи вида ./… покрыты списком редиректов', () => {
  it.each([
    ['ru', ru],
    ['en', en],
  ])('2.1: каждая подпись ./… в messages/%s.json есть в списке своего языка', (locale, messages) => {
    for (const { path, value } of pathLabels(messages)) {
      expect(LABEL_REDIRECTS, `${locale}.json ${path}: «${value}»`).toHaveProperty([`/${locale}/${value.slice(2)}`]);
    }
  });

  it('2.2: подписи ./… найдены — обход не пустой', () => {
    expect(pathLabels(ru).length + pathLabels(en).length).toBeGreaterThan(0);
  });

  it('2.3: обход находит подписи ./… во вложенных объектах и массивах', () => {
    const labels = pathLabels({ a: './x', b: ['./y', 'z'], c: { d: './w' } }).map(({ value }) => value);

    expect(labels).toEqual(['./x', './y', './w']);
  });
});
