import { expect, test, type APIRequestContext } from '@playwright/test';
import { PREVIEW_BASE_URL, SINK_BASE_URL } from './consts';
import type { SinkCall } from './types';

/**
 * Смоук нового потока: клиент получает письмо-приглашение, открывает личную ссылку и оставляет отзыв. Приглашение
 * заводит администратор через REST, письмо и уведомление ловит приемник заявок. Отказы проверяют интеграционные тесты.
 */

const ADMIN = { email: 'review-smoke@example.com', password: 'review-smoke-password' };

/** Название проекта — маркер прогона: по нему тест находит свои письмо и уведомление в приемнике. */
const MARKER = `review-smoke-${Date.now()}`;

/** Чаты бота из `LEAD_ENV` конфига Playwright: уведомление уходит по одному в каждый. */
const TELEGRAM_CHATS = ['100100', '200200'];

const AUTHOR = {
  fullName: 'Смоукова Анна Петровна',
  signature: 'Анна, студия йоги',
  occupation: 'Основательница студии',
  link: 'https://yoga.example.com',
  before: 'Пришли за сайтом с расписанием',
  process: 'Работали по неделям, без сюрпризов',
  after: 'Записей через сайт стало больше',
};

const authorization = (token: string) => ({ authorization: `JWT ${token}` });

let token = '';
let reviewId: number | string = '';
let invitePath = '';

const callsOf = async (request: APIRequestContext, channel: SinkCall['channel']) => {
  const response = await request.get(`${SINK_BASE_URL}/calls`);
  const calls = (await response.json()) as SinkCall[];

  return calls.filter((call) => call.channel === channel && call.body.includes(MARKER));
};

/** Первый администратор заводится формой первого входа; если пользователи уже есть — вход той же учеткой. */
const adminToken = async (request: APIRequestContext) => {
  const registered = await request.post('/api/users/first-register', { data: ADMIN });

  if (registered.ok()) {
    return ((await registered.json()) as { token: string }).token;
  }

  const login = await request.post('/api/users/login', { data: ADMIN });

  expect(login.status(), 'вход администратора').toBe(200);

  return ((await login.json()) as { token: string }).token;
};

test.beforeAll(async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: PREVIEW_BASE_URL });

  token = await adminToken(api);

  const created = await api.post('/api/reviews', {
    headers: authorization(token),
    data: { project: MARKER, email: `review-${MARKER}@example.com`, inviteLocale: 'ru' },
  });

  expect(created.status(), 'приглашение заведено через REST').toBe(201);
  reviewId = ((await created.json()) as { doc: { id: number | string } }).doc.id;

  const sent = await api.post('/api/review/invite', {
    headers: authorization(token),
    data: { id: reviewId, action: 'send' },
  });

  expect(sent.status(), 'приглашение отправлено').toBe(200);

  const [mail] = await callsOf(api, 'mail');

  invitePath = mail?.body.match(/\/ru\/review\/[A-Za-z0-9_-]+/)?.[0] ?? '';

  expect(invitePath, 'ссылка из письма').toMatch(/^\/ru\/review\/[A-Za-z0-9_-]+$/);

  await api.dispose();
});

test('отзыв по ссылке из письма доходит до «отзыв получен», в CMS и в Telegram', async ({ page, request }) => {
  await page.goto(invitePath);

  await page.getByTestId('review-full-name').fill(AUTHOR.fullName);
  await page.getByTestId('review-signature').fill(AUTHOR.signature);
  await page.getByTestId('review-occupation').fill(AUTHOR.occupation);
  await page.getByTestId('review-link').fill(AUTHOR.link);
  await page.getByTestId('review-answer-before').fill(AUTHOR.before);
  await page.getByTestId('review-answer-process').fill(AUTHOR.process);
  await page.getByTestId('review-answer-after').fill(AUTHOR.after);
  await page.getByTestId('review-consent').check();
  await page.getByTestId('review-license').check();
  await page.getByTestId('review-submit').click();

  await expect(page.getByTestId('review-received')).toBeVisible();

  const saved = await request.get(`/api/reviews/${reviewId}`, { headers: authorization(token) });

  expect(saved.status()).toBe(200);
  expect(((await saved.json()) as { status: string }).status).toBe('received');

  await expect
    .poll(async () =>
      (await callsOf(request, 'telegram'))
        .map((call) => String((JSON.parse(call.body) as { chat_id: unknown }).chat_id))
        .sort(),
    )
    .toEqual(TELEGRAM_CHATS);

  for (const call of await callsOf(request, 'telegram')) {
    expect(call.body, 'в уведомлении нет ФИО').not.toContain(AUTHOR.fullName);
  }
});
