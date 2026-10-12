import type { ComponentType } from 'react';
import type { CaseCard, CaseDetail, TeamMember, TeamRole } from '@/cms/types';
import type { BriefProps } from '@/components/Brief/types';
import type { ServicePageProps } from '@/components/ServicePage/types';
import type { DESIGN_NAMES, SECTION_NAMES } from './consts';

/** Направление дизайна сайта — одно из пяти, выбор хранится в cookie `design`. */
export type DesignName = (typeof DESIGN_NAMES)[number];

/** Секция страницы, у которой есть своя реализация в каждом направлении. */
export type SectionName = (typeof SECTION_NAMES)[number];

/** Секции, которым нужны данные: их читают серверные страницы, а клиентский чанк направления рисует. */
type DataSectionName = 'header' | 'works' | 'team' | 'case' | 'brief' | 'servicePage';

/** Пропсы шапки: пункт «Кейсы» показывается, только если кейсы есть. */
export type HeaderProps = { hasCases: boolean };

/** Пропсы секции «Работы»: опубликованные кейсы в порядке показа. */
export type WorksProps = { cases: CaseCard[] };

/** Пропсы секции «Команда»: ядро студии и сеть подрядчиков, каждая часть — в порядке показа. */
export type TeamProps = { core: TeamMember[]; network: TeamMember[] };

/** Карточка человека секции «Команда»: `network` — подрядчик из сети, `onCall` — тег «на связи весь проект» у ядра. */
export type TeamCardData = {
  member: TeamMember;
  network: boolean;
  skills: string[];
  onCall: boolean;
};

/**
 * Данные секции «Команда», общие для пяти направлений: сумма лет на всю команду, карточки ядра и сети;
 * `networkRoles` — роли пунктирной карточки сети, пока в CMS нет ее людей, иначе `null`.
 */
export type TeamSectionData = {
  years: number;
  core: TeamCardData[];
  network: TeamCardData[];
  networkRoles: readonly TeamRole[] | null;
};

/** Пропсы страницы кейса. */
export type CaseProps = { caseItem: CaseDetail };

/** Цветовая тема — вторая ось сайта, живет в next-themes. */
export type Theme = 'light' | 'dark';

/** Пропсы `<Name>Section` — компонента-чанка направления: какую секцию отрисовать и с какими данными. */
export type SectionProps =
  | ({ section: 'header' } & HeaderProps)
  | ({ section: 'works' } & WorksProps)
  | ({ section: 'team' } & TeamProps)
  | ({ section: 'case' } & CaseProps)
  | ({ section: 'brief' } & BriefProps)
  | ({ section: 'servicePage' } & ServicePageProps)
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
  team: ComponentType<TeamProps>;
  case: ComponentType<CaseProps>;
  footer: ComponentType;
  brief: ComponentType<BriefProps>;
  briefThanks: ComponentType;
  servicePage: ComponentType<ServicePageProps>;
};

/** Срок шага услуги: ярлык мелко, число или диапазон крупно, как «День 1»; без числа ярлык идет целиком. */
export type StepWhen = {
  label: string;
  value: string | null;
};
