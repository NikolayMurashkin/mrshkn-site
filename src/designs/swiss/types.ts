import type { ServiceOptionView } from '@/components/ServicePage/types';
import type { BriefChoice } from '@/lib/brief/types';
import type { StepWhen } from '../types';

/** Инлайновая иконка Swiss: стрелки и солнце — SVG 24×24 с квадратными концами, а не глиф (↗ нет в сабсете Geologica). */
export type SwissIconProps = {
  size?: number;
  className?: string;
};

export type SwissChoicesProps = {
  field: BriefChoice;
  values: readonly string[];
  selected: string;
  labelOf: (value: string) => string;
  onPick: (field: BriefChoice, value: string) => void;
};

export type SwissDesignChoiceProps = {
  selected: string;
  onPick: (field: BriefChoice, value: string) => void;
  labelOf: (value: string) => string;
};

/** Состояние сегмента прогресса квиза: пройден, текущий, впереди. */
export type SwissProgressState = 'done' | 'current' | 'todo';

export type SwissChecksProps = {
  items: readonly string[];
};

export type SwissBasicsProps = {
  /** Тег названия группы: на главной `h4` под `h3` блока, на странице услуги `h3` под `h2`. */
  titleTag: 'h3' | 'h4';
  /** Колонка рядом с карточкой тарифа: группы по две в ряд, с 480px — по одной. */
  narrow?: boolean;
};

export type SwissOptionsProps = {
  items: readonly ServiceOptionView[];
  testId: string;
  /** Колонка рядом с карточкой тарифа: опции в одну колонку. */
  narrow?: boolean;
};

/** Шаг работы: на главной — шаг 14 дней, на странице услуги — шаг из `services.<id>.process`. */
export type SwissStep = StepWhen & {
  id: string;
  title: string;
  text: string;
  /** День шага в `data-day`: есть только у шагов главной, их проверяет `process.spec.ts`. */
  day?: number;
};

export type SwissStepsProps = {
  steps: readonly SwissStep[];
  testId: string;
  /** Тег заголовка шага: на главной `span`, как до выноса, на странице услуги `h3` под `h2` блока; текст шага — `span` и `p`. */
  titleTag: 'h3' | 'span';
  /** Колонка страницы услуги: шаги по два в ряд, с 720px — по одному. */
  narrow?: boolean;
};
