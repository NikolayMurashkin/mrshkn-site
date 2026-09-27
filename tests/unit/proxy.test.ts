import { describe, expect, it } from 'vitest';
import { config } from '@/proxy';

/** Matcher прокси — регулярное выражение пути: страница, на которую он срабатывает, уходит под префикс языка. */
const matches = (pathname: string) => new RegExp(`^${config.matcher}$`).test(pathname);

describe('прокси языков', () => {
  it.each(['/admin', '/admin/login', '/admin/collections/posts/create', '/api/users/me', '/api/brief'])(
    '%s не уходит под префикс языка — это админка и REST Payload',
    (pathname) => {
      expect(matches(pathname)).toBe(false);
    },
  );

  it.each(['/_next/image', '/_next/static/chunks/main.js', '/robots.txt', '/sitemap.xml', '/favicon.ico'])(
    '%s не уходит под префикс языка — это служебный путь Next или файл',
    (pathname) => {
      expect(matches(pathname)).toBe(false);
    },
  );

  it.each(['/', '/ru', '/en/brief', '/ru/brief/thanks'])('%s проходит через прокси', (pathname) => {
    expect(matches(pathname)).toBe(true);
  });
});
