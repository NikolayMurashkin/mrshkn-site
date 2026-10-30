export const KINETIC_TICKER_ITEMS = ['landing', 'miniApps', 'company', 'shops', 'mvp', 'support'] as const;

export const KINETIC_TAPE_PROMISES = [
  'hero.kinetic.tapeCode',
  'hero.kinetic.tapeDeadline',
  'process.promises.warranty.value',
] as const;

/** Сколько раз список пунктов повторяется на ленте: хватает на ширину 1920 и на половину цикла `translateX(-50%)`. */
export const KINETIC_TAPE_REPEAT = 4;

export const KINETIC_BADGE_SIZE = 260;

export const KINETIC_BADGE_RING_RADIUS = 100;

export const KINETIC_BADGE_RING_LENGTH = Math.round(2 * Math.PI * KINETIC_BADGE_RING_RADIUS);

export const KINETIC_FOUNDED_YEAR = 2026;

export const KINETIC_STUDIO_EMAIL = 'hello@mrshkn.com';

/**
 * Высота липкой шапки Kinetic с запасом — как `scroll-padding-top` в `Header.module.scss`: линия, на которой
 * `useActiveSection` считает раздел текущим.
 */
export const KINETIC_HEADER_OFFSET = 96;

/** Окно, до которого включительно меню шапки Kinetic уходит в мобильную панель — `bp.$tablet` в `_breakpoints.scss`. */
export const KINETIC_MENU_MAX_WIDTH = 1080;

export const KINETIC_BADGE_CENTER = KINETIC_BADGE_SIZE / 2;

/** Классы формы отзыва: стили — глобальный `KineticReview.scss` в своем чанке (`KineticReviewStyles`), не CSS-модуль. */
export const KINETIC_REVIEW_CLASS = {
  page: 'k-review',
  head: 'k-review__head',
  kicker: 'k-review__kicker',
  title: 'k-review__title',
  lead: 'k-review__lead',
  form: 'k-review__form',
  group: 'k-review__group',
  groupTitle: 'k-review__group-title',
  note: 'k-review__note',
  fields: 'k-review__fields',
  field: 'k-review__field',
  label: 'k-review__label',
  input: 'k-review__input',
  textarea: 'k-review__textarea',
  hint: 'k-review__hint',
  fieldError: 'k-review__field-error',
  document: 'k-review__document',
  documentTitle: 'k-review__document-title',
  edition: 'k-review__edition',
  summary: 'k-review__summary',
  details: 'k-review__details',
  legal: 'k-review__legal',
  nowrap: 'k-review__nowrap',
  check: 'k-review__check',
  documentCheck: 'k-review__check--document',
  restrictions: 'k-review__restrictions',
  legend: 'k-review__legend',
  actions: 'k-review__actions',
  error: 'k-review__error',
  notice: 'k-review-notice',
  noticeTitle: 'k-review-notice__title',
  noticeText: 'k-review-notice__text',
  button: 'k-review__button',
} as const;
