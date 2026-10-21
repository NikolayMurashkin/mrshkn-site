import { after, NextResponse, type NextRequest } from 'next/server';
import { LEAD_RATE_LIMIT, UTM_COOKIE } from '@/lib/brief/consts';
import { notifyLead, recordLead } from '@/lib/brief/delivery';
import { parseLead, parseMarks } from '@/lib/brief/lead';
import { createRateLimiter } from '@/lib/brief/rate-limit';

const limiter = createRateLimiter(LEAD_RATE_LIMIT);

/**
 * Берется последний адрес в `x-forwarded-for`, а не первый: первый присылает сам клиент, и лимит
 * обходился бы одной строкой заголовка. Последний дописывает наш прокси — ему и верим.
 */
const addressOf = (request: NextRequest) => {
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((address) => address.trim())
    .filter(Boolean);

  return forwarded?.at(-1) || request.headers.get('x-real-ip') || 'unknown';
};

const pageOf = (request: NextRequest) => {
  const referer = request.headers.get('referer');

  if (!referer) {
    return '/';
  }

  try {
    return new URL(referer).pathname;
  } catch {
    return '/';
  }
};

export const POST = async (request: NextRequest) => {
  if (!limiter.allow(addressOf(request))) {
    return NextResponse.json({ ok: false, reason: 'rate' }, { status: 429 });
  }

  const input = await request.json().catch(() => null);
  const result = parseLead(input, {
    marks: parseMarks(request.cookies.get(UTM_COOKIE)?.value),
    page: pageOf(request),
  });

  if (!result.ok) {
    /** Боту отвечаем так же, как человеку: по ответу нельзя понять, что ловушка сработала. */
    if (result.reason === 'honeypot') {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, reason: result.reason }, { status: 422 });
  }

  const { lead } = result;
  const record = await recordLead(lead);

  /**
   * Заявка в базе — посетитель получает ответ сразу, бот и почта уходят после ответа: медленный канал не держит форму,
   * сбой остается строкой в логе. Запись не прошла — ответ ждет каналы: только они и сохраняют заявку.
   */
  if (record.id !== null) {
    after(() => notifyLead(lead, record));

    return NextResponse.json({ ok: true });
  }

  const { delivered, failed } = await notifyLead(lead, record);

  if (!delivered) {
    return NextResponse.json({ ok: false, reason: 'delivery', failed }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
};
