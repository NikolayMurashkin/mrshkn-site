import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { SINK_BASE_URL } from './consts';
import type { SinkCall } from './types';

/**
 * Смоук нового потока заявки — бесплатный замер с главной: форма «Проверьте свой сайт» → запись в CRM сайта → бот
 * в приемнике. Отказы (нет согласия, чужая схема адреса, ловушка) закрывает интеграционный тест обработчика.
 *
 * Лимит заявок живет в памяти сервера, а `reuseExistingServer` оставляет его между прогонами → свой адрес на прогон.
 */
const CLIENT_ADDRESS = `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.9`;

test.use({ extraHTTPHeaders: { 'x-forwarded-for': CLIENT_ADDRESS } });

const UTM_SOURCE = 'smoke-audit';

const FORM = { url: 'example.ru', contact: '@mrshkn_audit' };

/** Маркер уникален на копию теста: приемник общий, записи отбираются по маркеру в имени заявки. */
const markerOf = (prefix: string) => `${prefix} ${randomUUID()}`;

const telegramCallsOf = async (request: APIRequestContext, marker: string) => {
  const response = await request.get(`${SINK_BASE_URL}/calls`);
  const calls = (await response.json()) as SinkCall[];

  return calls.filter((call) => call.channel === 'telegram' && call.body.includes(marker));
};

test('замер: форма на главной → запись в CRM → бот получил заявку с адресом, меткой и ссылкой на карточку', async ({
  page,
  request,
}) => {
  const marker = markerOf('Проба замера');

  await page.goto(`/ru?utm_source=${UTM_SOURCE}`);

  const section = page.locator('#audit');

  await expect(section, 'секция «Проверьте свой сайт» на главной').toBeVisible();
  await section.getByTestId('audit-name').fill(marker);
  await section.getByTestId('audit-url').fill(FORM.url);
  await section.getByTestId('audit-contact').fill(FORM.contact);
  await section.getByTestId('audit-consent').check();
  await section.getByTestId('audit-submit').click();

  await expect(section.getByTestId('audit-success')).toBeVisible();

  await expect
    .poll(async () => (await telegramCallsOf(request, marker)).length, { message: 'вызов Telegram с маркером заявки' })
    .toBeGreaterThan(0);

  for (const call of await telegramCallsOf(request, marker)) {
    expect(call.body, 'вид заявки').toContain('Заявка: замер');
    expect(call.body, 'адрес сайта').toContain('https://example.ru/');
    expect(call.body, 'метка кампании').toContain(`utm_source=${UTM_SOURCE}`);
    /** Ссылка есть, только если запись в базу сборки прошла: обработчик пишет ее первой. */
    expect(call.body, 'ссылка на карточку заявки в админке').toContain('/admin/collections/leads/');
  }
});
