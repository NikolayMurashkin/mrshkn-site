import type { ConsentState } from './types';

/** Высота баннера с его отступом от низа окна: на столько у страницы запас снизу, пока баннер виден. */
export const BANNER_SPACE_VAR = '--cookie-banner-space';

/** Вне провайдера (отдельный рендер секции) баннера нет, а цели никуда не уходят. */
export const NO_CONSENT: ConsentState = {
  choice: null,
  choose: () => {},
  reopen: () => {},
  reachGoal: () => {},
};
