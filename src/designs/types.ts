import type { ComponentType } from 'react';
import type { CaseCard, CaseDetail } from '@/cms/types';
import type { DESIGN_NAMES, SECTION_NAMES } from './consts';

/** Направление дизайна сайта — одно из пяти, выбор хранится в cookie `design`. */
export type DesignName = (typeof DESIGN_NAMES)[number];

/** Секция страницы, у которой есть своя реализация в каждом направлении. */
export type SectionName = (typeof SECTION_NAMES)[number];

/** Секции, которым нужны данные: их читают серверные страницы, а клиентский чанк направления рисует. */
type DataSectionName = 'header' | 'works' | 'case';

/** Пропсы шапки: пункт «Кейсы» показывается, только если кейсы есть. */
export type HeaderProps = { hasCases: boolean };

/** Пропсы секции «Работы»: опубликованные кейсы в порядке показа. */
export type WorksProps = { cases: CaseCard[] };

/** Пропсы страницы кейса. */
export type CaseProps = { caseItem: CaseDetail };

/** Цветовая тема — вторая ось сайта, живет в next-themes. */
export type Theme = 'light' | 'dark';

/** Пропсы `<Name>Section` — компонента-чанка направления: какую секцию отрисовать и с какими данными. */
export type SectionProps =
  | ({ section: 'header' } & HeaderProps)
  | ({ section: 'works' } & WorksProps)
  | ({ section: 'case' } & CaseProps)
  | { section: Exclude<SectionName, DataSectionName> };

/** Пропсы `DesignSection` из реестра: секция какого направления нужна в этом слоте. */
export type DesignSectionProps = SectionProps & {
  design: DesignName;
};

/** Компоненты секций одного направления: по ним `renderSection` выбирает, что рисовать. */
export type DesignComponents = {
  header: ComponentType<HeaderProps>;
  hero: ComponentType;
  pricing: ComponentType;
  works: ComponentType<WorksProps>;
  process: ComponentType;
  case: ComponentType<CaseProps>;
  footer: ComponentType;
};
