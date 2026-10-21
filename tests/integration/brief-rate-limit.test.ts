import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEAD_RATE_LIMIT } from '@/lib/brief/consts';

/**
 * Лимит заявок с одного адреса — у самого обработчика `POST /api/brief`, вызванного напрямую. Тело пустое:
 * заявка не проходит разбор (422) и не доходит до каналов доставки и базы. Лимитер живет в модуле маршрута →
 * модуль грузится заново на каждый тест, иначе счетчик переживал бы тесты.
 */

type Post = (request: NextRequest) => Promise<Response>;

const START = new Date('2026-10-21T12:00:00+03:00');

let POST: Post;

const send = (forwardedFor: string) =>
  POST(
    new NextRequest('http://localhost/api/brief', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': forwardedFor },
      body: '{}',
    }),
  );

const sendTimes = async (count: number, forwardedFor: (index: number) => string) => {
  const statuses: number[] = [];

  for (let index = 0; index < count; index += 1) {
    statuses.push((await send(forwardedFor(index))).status);
  }

  return statuses;
};

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(START);
  vi.resetModules();
  ({ POST } = (await import('@/app/api/brief/route')) as { POST: Post });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('лимит заявок POST /api/brief', () => {
  it('11-й запрос с одного адреса в пределах окна — 429', async () => {
    const statuses = await sendTimes(10, () => '203.0.113.7');

    expect(statuses).toEqual(Array.from({ length: 10 }, () => 422));

    const response = await send('203.0.113.7');

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ ok: false, reason: 'rate' });
  });

  it('другой адрес в том же окне не упирается в чужой лимит', async () => {
    await sendTimes(10, () => '203.0.113.7');

    const response = await send('198.51.100.20');

    expect(response.status).toBe(422);
  });

  it('после окна лимита тот же адрес снова принимается', async () => {
    await sendTimes(10, () => '203.0.113.7');

    vi.setSystemTime(START.getTime() + LEAD_RATE_LIMIT.windowMs);

    const response = await send('203.0.113.7');

    expect(response.status).toBe(422);
  });

  it('подмена первого адреса в x-forwarded-for лимит не обходит', async () => {
    const statuses = await sendTimes(11, (index) => `10.0.0.${index + 1}, 203.0.113.7`);

    expect(statuses.slice(0, 10)).toEqual(Array.from({ length: 10 }, () => 422));
    expect(statuses[10]).toBe(429);
  });
});
