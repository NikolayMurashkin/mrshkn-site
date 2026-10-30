import type { ComponentType, RefObject } from 'react';
import type { CaseCard, CaseDetail } from '@/cms/types';
import type { BriefProps } from '@/components/Brief/types';
import type { ReviewProps } from '@/components/Review/types';
import type { ServicePageProps } from '@/components/ServicePage/types';
import type { DESIGN_NAMES, SECTION_NAMES } from './consts';

/** Направление дизайна сайта — одно из пяти, выбор хранится в cookie `design`. */
export type DesignName = (typeof DESIGN_NAMES)[number];

/** Секция страницы, у которой есть своя реализация в каждом направлении. */
export type SectionName = (typeof SECTION_NAMES)[number];

/** Секции, которым нужны данные: их читают серверные страницы, а клиентский чанк направления рисует. */
type DataSectionName = 'header' | 'works' | 'case' | 'brief' | 'servicePage' | 'review';

/** Пропсы шапки: пункт «Кейсы» показывается, только если кейсы есть. */
export type HeaderProps = { hasCases: boolean };

/** Где стоит секция «Работы»: на главной — самые новые кейсы и ссылка на все, на странице `/work` — все. */
export type WorksVariant = 'home' | 'page';

/** Пропсы секции «Работы»: опубликованные кейсы в порядке показа; `variant` по умолчанию `'home'`. */
export type WorksProps = { cases: CaseCard[]; variant?: WorksVariant };

/** Пропсы страницы кейса. */
export type CaseProps = { caseItem: CaseDetail };

/** Цветовая тема — вторая ось сайта, живет в next-themes. */
export type Theme = 'light' | 'dark';

/** Пропсы `<Name>Section` — компонента-чанка направления: какую секцию отрисовать и с какими данными. */
export type SectionProps =
  | ({ section: 'header' } & HeaderProps)
  | ({ section: 'works' } & WorksProps)
  | ({ section: 'case' } & CaseProps)
  | ({ section: 'brief' } & BriefProps)
  | ({ section: 'servicePage' } & ServicePageProps)
  | ({ section: 'review' } & ReviewProps)
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
  brief: ComponentType<BriefProps>;
  briefThanks: ComponentType;
  servicePage: ComponentType<ServicePageProps>;
  privacyPage: ComponentType;
  cookieBanner: ComponentType;
  review: ComponentType<ReviewProps>;
};

/** Срок шага услуги: ярлык мелко, число или диапазон крупно, как «День 1»; без числа ярлык идет целиком. */
export type StepWhen = {
  label: string;
  value: string | null;
};

/** Пропсы бургера мобильного меню: одна кнопка открывает панель и, ставши крестиком, закрывает ее. */
export type MobileMenuBurgerProps = {
  ref: RefObject<HTMLButtonElement | null>;
  type: 'button';
  'aria-expanded': boolean;
  'aria-controls': string;
  'aria-label': string;
  onClick: () => void;
};

/** Пропсы панели мобильного меню: закрытая остается в DOM пустой и под `hidden` — на нее ссылается `aria-controls`. */
export type MobileMenuPanelProps = {
  ref: RefObject<HTMLDivElement | null>;
  id: string;
  hidden: boolean;
};

/** Состояние мобильного меню шапки: общее для пяти направлений, разметка и вид — у каждого свои. */
export type MobileMenu = {
  open: boolean;
  burgerProps: MobileMenuBurgerProps;
  panelProps: MobileMenuPanelProps;
  /** Клик по пункту панели: меню закрывается, переход по якорю — родной, не отменяется. */
  onNavigate: () => void;
};
