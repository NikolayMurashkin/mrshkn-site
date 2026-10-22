import { HOME_CASES_LIMIT } from '@/content/work';
import type { WorksVariant } from './types';

/**
 * Какие карточки рисует секция «Работы»: на главной — первые `HOME_CASES_LIMIT` (порядок `getCases`, новые первыми)
 * и ссылка «Все работы», если кейсов больше; на странице `/work` — все, без ссылки.
 */
export const worksView = <TCase>(cases: readonly TCase[], variant: WorksVariant) => ({
  shown: variant === 'page' ? cases : cases.slice(0, HOME_CASES_LIMIT),
  hasMore: variant === 'home' && cases.length > HOME_CASES_LIMIT,
});
