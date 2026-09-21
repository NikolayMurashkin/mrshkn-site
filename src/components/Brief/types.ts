import type { BriefChoice } from '@/lib/brief/types';

/** Ответы квиза в состоянии компонента: до отправки любое поле может быть пустым. */
export type BriefAnswers = Record<BriefChoice, string> & {
  name: string;
  contact: string;
  comment: string;
};

export type BriefProps = {
  /** Направление из cookie: им предвыбран шаг стиля, чтобы человек не выбирал заново уже увиденное. */
  design: string;
  /** Тариф из `?plan=` на кнопке прайса: предвыбирает первый шаг. */
  plan: string | null;
};

export type ChoicesProps = {
  field: BriefChoice;
  values: readonly string[];
  selected: string;
  labelOf: (value: string) => string;
  onPick: (field: BriefChoice, value: string) => void;
};

export type DesignChoiceProps = {
  selected: string;
  onPick: (field: BriefChoice, value: string) => void;
  labelOf: (value: string) => string;
};

export type DesignThumbProps = {
  design: string;
};
