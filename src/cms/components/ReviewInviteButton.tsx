'use client';

import { Button, toast, useDocumentInfo } from '@payloadcms/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { REVIEW_INVITE_API, REVIEW_INVITE_TEXT } from './consts';
import type { ReviewInviteResponse } from './types';

/**
 * Кнопка в карточке приглашения: «Отправить» у неотправленного, «Продлить и отправить снова» у отправленного и еще
 * не заполненного. У полученных, опубликованных и прочих отзывов и у несохраненной записи кнопки нет.
 */
export const ReviewInviteButton = () => {
  const router = useRouter();
  const { id, savedDocumentData } = useDocumentInfo();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!id || savedDocumentData?.status !== 'invited') {
    return null;
  }

  const action = sent || savedDocumentData.sentAt ? 'renew' : 'send';

  const invite = async () => {
    setSending(true);

    try {
      const response = await fetch(REVIEW_INVITE_API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const result = (await response.json().catch(() => ({ ok: false }))) as ReviewInviteResponse;

      if (!result.ok) {
        const reason = response.status === 409 ? 'conflict' : result.reason === 'mail' ? 'mail' : 'other';

        toast.error(REVIEW_INVITE_TEXT.failed[reason]);

        return;
      }

      setSent(true);
      toast.success(`${REVIEW_INVITE_TEXT.sent} ${new Date(result.expiresAt).toLocaleString('ru-RU')}`);
      router.refresh();
    } catch {
      toast.error(REVIEW_INVITE_TEXT.failed.other);
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      buttonStyle="secondary"
      size="medium"
      margin={false}
      disabled={sending}
      onClick={invite}
    >
      {sending ? REVIEW_INVITE_TEXT.sending : REVIEW_INVITE_TEXT[action]}
    </Button>
  );
};
