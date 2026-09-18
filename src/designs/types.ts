import type { ComponentType } from 'react';
import type { DESIGN_NAMES, SECTION_NAMES } from './consts';

/** Направление дизайна сайта — одно из пяти, выбор хранится в cookie `design`. */
export type DesignName = (typeof DESIGN_NAMES)[number];

/** Секция страницы, у которой есть своя реализация в каждом направлении. */
export type SectionName = (typeof SECTION_NAMES)[number];

/** Реализованные секции одного направления; отсутствующие берутся у дефолтного. */
export type DesignSections = Partial<Record<SectionName, ComponentType>>;

export type DesignRegistry = Record<DesignName, DesignSections>;
