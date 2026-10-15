import config from '@payload-config';
import { getPayload } from 'payload';
import { reviewView } from '../lib/review/state';
import type { ReviewState } from '../lib/review/types';
import type { Review } from '../payload-types';

/** Приглашение по коду ссылки. Код — это и есть пропуск, поэтому поиск идет мимо прав коллекции. */
export const findReviewByCode = async (code: string): Promise<Review | null> => {
  if (!code) {
    return null;
  }

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'reviews',
    where: { code: { equals: code } },
    limit: 1,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  return docs[0] ?? null;
};

/**
 * Что показать по ссылке-приглашению. Наружу — только вид и, для формы, название проекта: почта, ФИО и все
 * остальное из записи на страницу не попадают.
 */
export const getReviewState = async (code: string, now = new Date()): Promise<ReviewState> => {
  const record = await findReviewByCode(code);
  const view = reviewView(record, now);

  return view === 'form' && record ? { view, project: record.project } : { view };
};
