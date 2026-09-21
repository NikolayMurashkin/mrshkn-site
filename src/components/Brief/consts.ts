import type { BriefStep } from '@/lib/brief/types';

/** Какие ответы обязаны быть заполнены, чтобы шаг пустил дальше. */
export const BRIEF_STEP_REQUIRED: Record<BriefStep, readonly string[]> = {
  product: ['product'],
  niche: ['niche'],
  design: ['design'],
  scope: ['timing', 'budget'],
  contacts: ['name', 'contact'],
};

/** Пять направлений показываются миниатюрами, «доверяю студии» — обычной кнопкой. */
export const BRIEF_DESIGN_THUMBS = ['kinetic', 'terminal', 'pop', 'swiss', 'editorial'] as const;

/** Что рисует миниатюра направления: полоски заголовка, текста и кнопка в его токенах. */
export const THUMB_LINES = [72, 100, 54] as const;
