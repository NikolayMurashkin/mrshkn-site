import config from '@payload-config';
import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getPayload } from 'payload';
import { Role } from '@/cms/consts';
import { sendMail } from '@/lib/delivery/mail';
import { REVIEW_CODE_BYTES, REVIEW_INVITE_TTL_MS } from '@/lib/review/consts';
import { reviewInviteMail } from '@/lib/review/mail';

const INVITE_ACTIONS = ['send', 'renew'] as const;

const refuse = (status: number, reason: string) => NextResponse.json({ ok: false, reason }, { status });

const parseInvite = (input: unknown) => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const { id, action } = input as Record<string, unknown>;
  const numericId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id;

  return Number.isSafeInteger(numericId) && INVITE_ACTIONS.includes(action as (typeof INVITE_ACTIONS)[number])
    ? { id: numericId as number, action: action as (typeof INVITE_ACTIONS)[number] }
    : null;
};

/**
 * Кнопки «Отправить приглашение» и «Продлить и отправить снова» в админке. Только администратор: вход — cookie админки
 * или `Authorization: JWT`. Код и сроки пишутся только после того, как письмо ушло: упала почта — приглашение
 * остается неотправленным, и кнопку можно нажать снова.
 */
export const POST = async (request: NextRequest) => {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });

  if (user?.role !== Role.Admin) {
    return refuse(403, 'forbidden');
  }

  const invite = parseInvite(await request.json().catch(() => null));

  if (!invite) {
    return refuse(400, 'fields');
  }

  const record = await payload.findByID({
    collection: 'reviews',
    id: invite.id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  });

  if (!record) {
    return refuse(404, 'missing');
  }

  const sending = invite.action === 'send';
  const allowed = record.status === 'invited' && (sending ? !record.sentAt : Boolean(record.sentAt && record.code));

  if (!allowed) {
    return refuse(409, 'state');
  }

  const now = new Date();
  const code = sending ? randomBytes(REVIEW_CODE_BYTES).toString('base64url') : (record.code as string);
  const expiresAt = new Date(now.getTime() + REVIEW_INVITE_TTL_MS).toISOString();

  try {
    await sendMail(reviewInviteMail({ to: record.email, locale: record.inviteLocale, project: record.project, code }));
  } catch (error) {
    console.error('Приглашение к отзыву не ушло письмом:', error);

    return refuse(502, 'mail');
  }

  await payload.update({
    collection: 'reviews',
    id: record.id,
    depth: 0,
    overrideAccess: true,
    data: sending ? { code, sentAt: now.toISOString(), expiresAt } : { expiresAt },
  });

  return NextResponse.json({ ok: true, expiresAt });
};
