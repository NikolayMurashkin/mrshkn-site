import config from '@payload-config';
import { NextResponse, type NextRequest } from 'next/server';
import { getPayload } from 'payload';
import { findReviewByCode } from '@/cms/reviews';
import { SITE_URL } from '@/lib/consts';
import { sendTelegram } from '@/lib/delivery/telegram';
import { REVIEW_ADMIN_PATH } from '@/lib/review/consts';
import { reviewDocuments } from '@/lib/review/documents';
import { parseReview } from '@/lib/review/parse';
import { reviewView } from '@/lib/review/state';

/** Уведомление без персональных данных: только проект и ссылка на запись в админке, остальное там. */
const notify = async (project: string, id: number) => {
  try {
    await sendTelegram(`Новый отзыв: ${project}\n${SITE_URL}${REVIEW_ADMIN_PATH}/${id}`);
  } catch (error) {
    console.error('Уведомление об отзыве не ушло в Telegram:', error);
  }
};

/**
 * Отзыв по личной ссылке. Неизвестный, просроченный и отозванный код отвечают одинаково — 404; использованный — 409,
 * чтобы форма показала «отзыв получен». В любом отказе запись не меняется. Уведомление ждется, но его ошибка
 * отзыв не теряет: запись уже в базе, клиент получает успех.
 */
export const POST = async (request: NextRequest) => {
  const input = await request.json().catch(() => null);
  const parsed = parseReview(input);

  if (!parsed.ok) {
    return NextResponse.json({ ok: false, reason: parsed.reason }, { status: 400 });
  }

  const { code, locale, ...author } = parsed.review;
  const now = new Date();
  const record = await findReviewByCode(code);
  const view = reviewView(record, now);

  if (!record || view === 'invalid') {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 404 });
  }

  if (view === 'received') {
    return NextResponse.json({ ok: false, reason: 'used' }, { status: 409 });
  }

  const documents = reviewDocuments(locale);
  const payload = await getPayload({ config });

  await payload.update({
    collection: 'reviews',
    id: record.id,
    depth: 0,
    overrideAccess: true,
    data: {
      ...author,
      status: 'received',
      locale,
      consentText: documents.consent,
      licenseText: documents.license,
      consentVersion: documents.version,
      consentAt: now.toISOString(),
    },
  });

  await notify(record.project, record.id);

  return NextResponse.json({ ok: true });
};
