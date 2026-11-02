import { after, NextResponse, type NextRequest } from 'next/server';
import { saveAuditLead } from '@/cms/leads';
import { formatAuditLead, parseAuditLead } from '@/lib/audit/lead';
import { LEAD_RATE_LIMIT } from '@/lib/brief/consts';
import { deliverLead } from '@/lib/brief/delivery';
import { createRateLimiter } from '@/lib/brief/rate-limit';
import { addressOf, leadContextOf } from '@/lib/brief/request';

/** Свой счетчик, параметры квиза: заявка квиза и замера с одного адреса не съедают лимит друг друга. */
const limiter = createRateLimiter(LEAD_RATE_LIMIT);

export const POST = async (request: NextRequest) => {
  if (!limiter.allow(addressOf(request))) {
    return NextResponse.json({ ok: false, reason: 'rate' }, { status: 429 });
  }

  const input = await request.json().catch(() => null);
  const result = parseAuditLead(input, leadContextOf(request));

  if (!result.ok) {
    /** Боту отвечаем так же, как человеку: по ответу нельзя понять, что ловушка сработала. */
    if (result.reason === 'honeypot') {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 });
  }

  const { lead } = result;
  const delivery = await deliverLead(
    () => saveAuditLead(lead),
    {
      text: formatAuditLead(lead),
      subject: `Заявка на замер: ${lead.name}`,
    },
    after,
  );

  if (!delivery.ok) {
    return NextResponse.json({ ok: false, reason: 'delivery', failed: delivery.failed }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
};
