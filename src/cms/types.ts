import type { Case } from '../payload-types';

/** Кейс, как его видит фронт: только поля карточки, без служебных полей Payload. */
export type CaseCard = Pick<Case, 'title' | 'slug' | 'kind' | 'niche' | 'design'> & { demoUrl: string | null };
