import type { DESIGN_NAMES, SECTION_NAMES } from './consts';

/** Направление дизайна сайта — одно из пяти, выбор хранится в cookie `design`. */
export type DesignName = (typeof DESIGN_NAMES)[number];

/** Секция страницы, у которой есть своя реализация в каждом направлении. */
export type SectionName = (typeof SECTION_NAMES)[number];

/** Цветовая тема — вторая ось сайта, живет в next-themes. */
export type Theme = 'light' | 'dark';

/** Пропсы `<Name>Section` — компонента-чанка направления: какую секцию отрисовать. */
export type SectionProps = {
  section: SectionName;
};

/** Пропсы `DesignSection` из реестра: секция какого направления нужна в этом слоте. */
export type DesignSectionProps = SectionProps & {
  design: DesignName;
};
