import { REVIEW_SENT_STATUSES } from './consts';
import type { ReviewStateRecord, ReviewView } from './types';

/**
 * Вид страницы по записи приглашения. Неизвестный, просроченный, неотправленный код и отозванное согласие дают один
 * и тот же вид: по странице нельзя узнать, существовал ли код. Об отклонении отзыва страница тоже молчит.
 */
export const reviewView = (record: ReviewStateRecord | null, now: Date): ReviewView => {
  if (!record) {
    return 'invalid';
  }

  if (REVIEW_SENT_STATUSES.includes(record.status)) {
    return 'received';
  }

  if (record.status !== 'invited' || !record.sentAt || !record.expiresAt) {
    return 'invalid';
  }

  return Date.parse(record.expiresAt) > now.getTime() ? 'form' : 'invalid';
};
