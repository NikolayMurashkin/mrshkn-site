import type { ServiceOptionView } from '@/components/ServicePage/types';
import type { BriefChoice } from '@/lib/brief/types';

/** Строка панели build.log в hero Terminal. */
export type TerminalLogLine = {
  /** Ключ текста строки в `hero.terminal.log`. */
  key: 'brief' | 'prepayment' | 'concept' | 'staging' | 'lighthouse' | 'handover' | 'warranty';
  /** Номер дня в квадратных скобках; null — строка без дня (гарантия). */
  day: string | null;
  /** Статус в конце строки: `ok` зеленым, `active` акцентом с курсором. */
  status: 'ok' | 'active';
};

export type TerminalChoicesProps = {
  field: BriefChoice;
  values: readonly string[];
  selected: string;
  labelOf: (value: string) => string;
  onPick: (field: BriefChoice, value: string) => void;
};

export type TerminalDesignChoiceProps = {
  selected: string;
  onPick: (field: BriefChoice, value: string) => void;
  labelOf: (value: string) => string;
};

export type TerminalChecksProps = {
  items: readonly string[];
};

export type TerminalBasicsProps = {
  /** Тег заголовка группы: `h4` под `h3` блока на главной, `h3` под `h2` блока на странице услуги. */
  titleTag: 'h3' | 'h4';
  /** Колонка страницы услуги рядом с карточкой тарифа: группы по две в ряд, а не по четыре. */
  narrow?: boolean;
};

export type TerminalOptionsProps = {
  items: readonly ServiceOptionView[];
  testId: string;
  /** Колонка страницы услуги: опции в одну колонку на любой ширине. */
  narrow?: boolean;
};

/** Шаг работы: на главной — шаг 14 дней с номером дня, на странице услуги — шаг из `services.<id>.process`. */
export type TerminalStep = {
  id: string;
  label: string;
  title: string;
  text: string;
  /** День шага в `data-day`: есть только у шагов главной, их проверяет `process.spec.ts`. */
  day?: number;
};

export type TerminalStepsProps = {
  steps: readonly TerminalStep[];
  testId: string;
  /** Тег заголовка шага: на главной `span`, как до выноса, на странице услуги `h3` под `h2` блока. */
  titleTag: 'h3' | 'span';
  /** Колонка страницы услуги: шаги по два в ряд, с 720px — по одному. */
  narrow?: boolean;
};
