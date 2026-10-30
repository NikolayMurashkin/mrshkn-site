import type { PopTone } from './types';

export const POP_STICKERS = ['lighthouse', 'deadline', 'warranty'] as const;

export const POP_HEADER_OFFSET = 108;

/** Окно, до которого включительно меню шапки Pop уходит в мобильную панель — порог 1080 в `Header.module.scss`. */
export const POP_MENU_MAX_WIDTH = 1080;

export const POP_STUDIO_EMAIL = 'hello@mrshkn.com';

export const POP_STEP_TONES: readonly PopTone[] = [1, 2, 3, 4];

/** Образцы цвета на отрезке «выбор стиля» шкалы процесса: классы трех цветов направления. */
export const POP_SCALE_SWATCHES = ['scaleSwatchAccent', 'scaleSwatchAlt', 'scaleSwatchWarm'] as const;

export const POP_STEP_TEXT_TAGS = { h3: 'p', span: 'span' } as const;
