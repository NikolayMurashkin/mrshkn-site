import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { HONEYPOT_FIELD } from '@/lib/brief/consts';
import { SINK_BASE_URL } from './consts';
import { openDesign } from './open-design';
import type { SinkCall } from './types';

/**
 * Лимит заявок живет в памяти сервера, а `reuseExistingServer` оставляет его между прогонами.
 * Свой адрес на каждый прогон не дает четвертому подряд запуску покраснеть на пустом месте.
 */
const CLIENT_ADDRESS = `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.7`;

test.use({ extraHTTPHeaders: { 'x-forwarded-for': CLIENT_ADDRESS } });

const MARKS = {
  utm_source: 'avito',
  utm_medium: 'cpc',
  utm_campaign: 'clinics',
  utm_content: 'dental-demo',
};

const ANSWERS = {
  product: 'miniApp',
  niche: 'clinic',
  design: 'swiss',
  timing: 'twoWeeks',
  budget: 'to250',
  contact: '@mrshkn_test',
  comment: 'Нужна запись к врачу внутри Telegram.',
};

const resetSink = (request: APIRequestContext) => request.delete(`${SINK_BASE_URL}/calls`);

const callsOf = async (request: APIRequestContext, marker: string) => {
  const response = await request.get(`${SINK_BASE_URL}/calls`);
  const calls = (await response.json()) as SinkCall[];

  return calls.filter((call) => call.body.includes(marker));
};

const pick = (page: Page, value: string) => page.locator(`[data-testid="brief-option"][data-value="${value}"]`).click();

const goNext = (page: Page) => page.getByTestId('brief-next').click();

/** Проходит квиз до последнего шага; имя заявки — маркер, по нему тест отличает свои записи в приемнике. */
const walkBrief = async (page: Page, marker: string) => {
  await pick(page, ANSWERS.product);
  await goNext(page);
  await pick(page, ANSWERS.niche);
  await goNext(page);
  await pick(page, ANSWERS.design);
  await goNext(page);
  await pick(page, ANSWERS.timing);
  await pick(page, ANSWERS.budget);
  await goNext(page);
  await page.getByTestId('brief-name').fill(marker);
  await page.getByTestId('brief-contact').fill(ANSWERS.contact);
  await page.getByTestId('brief-comment').fill(ANSWERS.comment);
};

const leadPayload = (marker: string, overrides: Record<string, unknown> = {}) => ({
  ...ANSWERS,
  name: marker,
  consent: true,
  [HONEYPOT_FIELD]: '',
  plan: null,
  ...overrides,
});

test.describe('квиз и заявка', () => {
  test('заявка уходит в бот, на почту и в Bitrix24 с источником, нишей, стилем и метками', async ({
    page,
    request,
  }) => {
    const marker = `Проба бота ${Date.now()}`;

    await resetSink(request);
    await page.goto(`/ru?${new URLSearchParams(MARKS)}`);
    await page.getByRole('main').locator('section').first().getByRole('link').first().click();

    await expect(page).toHaveURL(/\/ru\/brief$/);

    await walkBrief(page, marker);
    await page.getByTestId('brief-consent').check();
    await page.getByTestId('brief-submit').click();

    await expect(page).toHaveURL(/\/ru\/brief\/thanks$/);
    await expect(page.getByTestId('brief-thanks')).toBeVisible();

    /** Телеграм-вызова два: бот пишет обоим получателям из `TELEGRAM_CHAT_IDS` — Николаю и жене. */
    await expect
      .poll(async () => (await callsOf(request, marker)).map((call) => call.channel).sort())
      .toEqual(['bitrix', 'mail', 'telegram', 'telegram']);

    for (const call of await callsOf(request, marker)) {
      expect(call.body, `${call.channel}: источник`).toContain('source=site');
      expect(call.body, `${call.channel}: ниша`).toContain(`niche=${ANSWERS.niche}`);
      expect(call.body, `${call.channel}: стиль`).toContain(`design=${ANSWERS.design}`);

      for (const [mark, value] of Object.entries(MARKS)) {
        expect(call.body, `${call.channel}: ${mark}`).toContain(`${mark}=${value}`);
      }
    }
  });

  test('без чекбокса согласия кнопка не нажимается, а прямой запрос отвергается', async ({ page, request }) => {
    const marker = `Проба согласия ${Date.now()}`;

    await resetSink(request);
    await page.goto('/ru/brief');
    await walkBrief(page, marker);

    await expect(page.getByTestId('brief-submit')).toBeDisabled();

    const response = await request.post('/api/brief', { data: leadPayload(marker, { consent: false }) });

    expect(response.status()).toBe(422);
    expect(await callsOf(request, marker)).toEqual([]);
  });

  test('тариф из прайса предвыбирает первый шаг', async ({ page }) => {
    await openDesign(page, 'kinetic', { path: '/brief?plan=miniApp' });

    await expect(page.locator('[data-testid="brief-option"][data-value="miniApp"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId('brief-next')).toBeEnabled();
  });

  test('заполненный honeypot: ответ 200 и ни одной отправки', async ({ request }) => {
    const marker = `Проба ловушки ${Date.now()}`;

    await resetSink(request);

    const response = await request.post('/api/brief', {
      data: leadPayload(marker, { [HONEYPOT_FIELD]: 'ООО «Бот»' }),
    });

    expect(response.status()).toBe(200);
    expect(await callsOf(request, marker)).toEqual([]);
  });
});
