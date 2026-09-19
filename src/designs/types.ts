import type { DESIGN_NAMES, SECTION_NAMES } from './consts';

/** Направление дизайна сайта — одно из пяти, выбор хранится в cookie `design`. */
export type DesignName = (typeof DESIGN_NAMES)[number];

/** Секция страницы, у которой есть своя реализация в каждом направлении. */
export type SectionName = (typeof SECTION_NAMES)[number];

/** Цветовая тема — вторая ось сайта, живет в next-themes. */
export type Theme = 'light' | 'dark';

/** Пропсы компонента-секции направления: какую секцию отрисовать. */
export type DesignSectionProps = {
  section: SectionName;
};
