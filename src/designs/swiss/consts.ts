/** Высота липкой шапки Swiss (22 + 40 + 22 + линия 1): линия, на которой `useActiveSection` считает раздел текущим. */
export const SWISS_HEADER_OFFSET = 85;

/** Окно, до которого включительно меню шапки Swiss уходит в мобильную панель — порог 720 в `Header.module.scss`. */
export const SWISS_MENU_MAX_WIDTH = 720;

export const SWISS_STUDIO_EMAIL = 'hello@mrshkn.com';

/** Направляющие hero: по одной на колонку сетки; на 720 и уже CSS оставляет четыре. */
export const SWISS_GUIDES = Array.from({ length: 12 }, (_, index) => index);

/** Обложка кейса в «Работах»: три колонки, с 1080 — две, с 720 — одна. */
export const SWISS_CASE_CARD_SIZES = '(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw';

/** Метрик в карточке «Работ» у Swiss — две, как в DS `CaseCard`; общий `CARD_METRICS_LIMIT` остается у других направлений. */
export const SWISS_CARD_METRICS_LIMIT = 2;

export const SWISS_COUNT_DIGITS = 2;

export const SWISS_STEP_TEXT_TAGS = { h3: 'p', span: 'span' } as const;
