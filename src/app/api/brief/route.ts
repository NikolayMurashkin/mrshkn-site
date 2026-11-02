import { after, NextResponse, type NextRequest } from 'next/server';
import { LEAD_RATE_LIMIT } from '@/lib/brief/consts';
import { deliverBriefLead } from '@/lib/brief/delivery';
import { parseLead } from '@/lib/brief/lead';
import { createRateLimiter } from '@/lib/brief/rate-limit';
import { addressOf, leadContextOf } from '@/lib/brief/request';

const limiter = createRateLimiter(LEAD_RATE_LIMIT);

export const POST = async (request: NextRequest) => {
  if (!limiter.allow(addressOf(request))) {
    return NextResponse.json({ ok: false, reason: 'rate' }, { status: 429 });
  }

  const input = await request.json().catch(() => null);
  const result = parseLead(input, leadContextOf(request));

  if (!result.ok) {
    /** Боту отвечаем так же, как человеку: по ответу нельзя понять, что ловушка сработала. */
    if (result.reason === 'honeypot') {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, reason: result.reason }, { status: 422 });
  }

  const delivery = await deliverBriefLead(result.lead, after);

  if (!delivery.ok) {
    return NextResponse.json({ ok: false, reason: 'delivery', failed: delivery.failed }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
};
