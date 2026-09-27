import { expect, test } from '@playwright/test';
import { LOCALES, PRODUCTION_BASE_URL } from './consts';

/**
 * `withPayload` вешает на все адреса `Critical-CH: Sec-CH-Prefers-Color-Scheme` — подсказку нужна только админке.
 * На странице сайта Chrome при первом визите из-за нее повторяет запрос документа: лишний круг до сервера до LCP.
 */
const CLIENT_HINT_HEADERS = ['critical-ch', 'accept-ch'];

const PAGES = LOCALES.flatMap((locale) => [`/${locale}`, `/${locale}/brief`, `/${locale}/brief/thanks`]);

test.describe('страницы сайта не просят подсказок клиента', () => {
  for (const path of PAGES) {
    test(`${path} без Critical-CH и Accept-CH`, async ({ request }) => {
      const response = await request.get(`${PRODUCTION_BASE_URL}${path}`);

      expect(response.status()).toBe(200);
      expect(Object.keys(response.headers()).filter((name) => CLIENT_HINT_HEADERS.includes(name))).toEqual([]);
    });
  }
});
