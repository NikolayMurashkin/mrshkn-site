import type { ServiceOptionView } from '@/components/ServicePage/types';
import type { BriefChoice } from '@/lib/brief/types';
import type { StepWhen } from '../types';

/** Размер инлайновой иконки Pop: стрелки и звезда рисуются SVG, а не глифом — у Rubik нет стрелок. */
export type PopIconProps = {
  size?: number;
  className?: string;
};

export type PopChoicesProps = {
  field: BriefChoice;
  values: readonly string[];
  selected: string;
  labelOf: (value: string) => string;
  onPick: (field: BriefChoice, value: string) => void;
};

export type PopDesignChoiceProps = {
  selected: string;
  onPick: (field: BriefChoice, value: string) => void;
  labelOf: (value: string) => string;
};

/** Цвет фишки по циклу Pop: желтая, коралловая, фиолетовая, ink. */
export type PopTone = 1 | 2 | 3 | 4;

export type PopChecksProps = {
  items: readonly string[];
  /** Галочки цветом текста: на желтой карточке тарифа `accent-ink` в темной теме не читается. */
  inheritColor?: boolean;
};

export type PopBasicsProps = {
  /** Тег названия группы: на главной `h4` под `h3` блока, на странице услуги `h3` под `h2`. */
  titleTag: 'h3' | 'h4';
  /** Колонка рядом с карточкой тарифа: группы по две в ряд, с 480px — по одной. */
  narrow?: boolean;
};

export type PopOptionsProps = {
  items: readonly ServiceOptionView[];
  testId: string;
  /** Колонка рядом с карточкой тарифа: вторая колонка прайса — только когда в каждой название встает рядом с ценой. */
  narrow?: boolean;
};

/** Шаг работы: на главной — шаг 14 дней, на странице услуги — шаг из `services.<id>.process`. */
export type PopStep = StepWhen & {
  id: string;
  title: string;
  text: string;
  /** День шага в `data-day`: есть только у шагов главной, их проверяет `process.spec.ts`. */
  day?: number;
};

export type PopStepsProps = {
  steps: readonly PopStep[];
  testId: string;
  /** Тег заголовка шага: на главной `span`, как до выноса, на странице услуги `h3` под `h2` блока; текст шага — `span` и `p`. */
  titleTag: 'h3' | 'span';
  /** Колонка страницы услуги: шаги-стикеры по два в ряд, с 720px — по одному. */
  narrow?: boolean;
};
