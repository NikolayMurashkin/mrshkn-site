import { PROCESS_STEPS } from '@/content/process';

/** Высота липкой шапки Swiss (22 + 40 + 22 + линия 1): линия, на которой `useActiveSection` считает раздел текущим. */
export const SWISS_HEADER_OFFSET = 85;

export const SWISS_STUDIO_EMAIL = 'hello@mrshkn.com';

/** Направляющие hero: по одной на колонку сетки; на 720 и уже CSS оставляет четыре. */
export const SWISS_GUIDES = Array.from({ length: 12 }, (_, index) => index);

/** Шкала «Как проходят две недели»: колонка на день, ключевые дни — дни шагов. */
export const SWISS_SCALE_DAYS = Array.from({ length: 14 }, (_, index) => index + 1);

export const SWISS_KEY_DAYS: ReadonlySet<number> = new Set(PROCESS_STEPS.map((step) => step.day));

/** Обложка кейса в «Работах»: три колонки, с 1080 — две, с 720 — одна. */
export const SWISS_CASE_CARD_SIZES = '(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw';

/** Метрик в карточке «Работ» у Swiss — две, как в DS `CaseCard`; общий `CARD_METRICS_LIMIT` остается у других направлений. */
export const SWISS_CARD_METRICS_LIMIT = 2;

export const SWISS_COUNT_DIGITS = 2;

export const SWISS_STEP_TEXT_TAGS = { h3: 'p', span: 'span' } as const;
