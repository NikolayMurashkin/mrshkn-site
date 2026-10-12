import type { ServiceOptionView } from '@/components/ServicePage/types';
import type { BriefChoice } from '@/lib/brief/types';
import type { EDITORIAL_WORKS_LAYOUTS, EDITORIAL_WORKS_SPREAD } from './consts';

/** Инлайновая иконка Editorial: стрелки — тонкий SVG 24×24 со скругленными концами, под антикву. */
export type EditorialIconProps = {
  size?: number;
  className?: string;
};

export type EditorialChoicesProps = {
  field: BriefChoice;
  values: readonly string[];
  selected: string;
  labelOf: (value: string) => string;
  onPick: (field: BriefChoice, value: string) => void;
};

export type EditorialDesignChoiceProps = {
  selected: string;
  onPick: (field: BriefChoice, value: string) => void;
  labelOf: (value: string) => string;
};

/** Состояние сегмента прогресса квиза: пройден, текущий, впереди. */
export type EditorialProgressState = 'done' | 'current' | 'todo';

/** Раскладка «Кейсов»: один материал, два или разворот из главного и боковых. */
export type EditorialWorksLayout =
  (typeof EDITORIAL_WORKS_LAYOUTS)[keyof typeof EDITORIAL_WORKS_LAYOUTS] | typeof EDITORIAL_WORKS_SPREAD;

export type EditorialDashesProps = {
  items: readonly string[];
};

export type EditorialRubricProps = {
  label: string;
  note?: string;
};

export type EditorialBasicsProps = {
  /** Тег названия группы: на главной `h4` под `h3` блока, на странице услуги `h3` под `h2`. */
  titleTag: 'h3' | 'h4';
  /** Колонка рядом с карточкой тарифа: группы по две в ряд, с 720px — по одной. */
  narrow?: boolean;
};

export type EditorialOptionsProps = {
  items: readonly ServiceOptionView[];
  testId: string;
  /** Колонка рядом с карточкой тарифа: опции в одну колонку. */
  narrow?: boolean;
};
