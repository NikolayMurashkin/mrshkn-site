import type { CaseCoverLayout } from './types.ts';

/**
 * Шаблон коллажа «ноутбук + телефон»: холст размера обложки засева, экран ноутбука в пропорции снимка 1440×900,
 * экран телефона — 390×844. Телефон стоит справа спереди и перекрывает край ноутбука.
 */
export const CASE_COVER_LAYOUT: CaseCoverLayout = {
  width: 1600,
  height: 1000,
  laptop: { x: 209, y: 136, width: 1040, height: 650 },
  phone: { x: 1169, y: 244, width: 290, height: 628 },
};

/** Нейтральный фон и корпуса устройств: обложка общая для всех направлений сайта, цветов направлений в ней нет. */
export const CASE_COVER_COLORS = {
  background: '#e8e9ec',
  body: '#1c1d21',
  base: '#c9cbd1',
  baseEdge: '#a9acb4',
  shadow: '#000000',
} as const;

/** Рамка экрана ноутбука, нижняя «челюсть» и подставка под корпусом, px. */
export const LAPTOP_FRAME = { bezel: 22, chin: 30, radius: 26, baseOverhang: 60, baseHeight: 30, baseRadius: 14 };

/** Рамка телефона и скругления корпуса и экрана, px. */
export const PHONE_FRAME = { bezel: 14, radius: 52, screenRadius: 38 };

/** Мягкая тень под устройствами: смещение вниз и размытие, px; прозрачность. */
export const COVER_SHADOW = { offset: 18, blur: 22, opacity: 0.18 };

export const CASE_COVER_USAGE = 'yarn case:cover <снимок 1440> <снимок 390> <файл>';
