import type { ChangeEvent } from 'react';
import type { DesignName } from '@/designs/types';
import type { BriefChoice, BriefStep } from '@/lib/brief/types';

/** Ответы квиза в состоянии компонента: до отправки любое поле может быть пустым. */
export type BriefAnswers = Record<BriefChoice, string> & {
  name: string;
  contact: string;
  comment: string;
};

export type BriefProps = {
  /** Направление из cookie: им предвыбран шаг стиля, чтобы человек не выбирал заново уже увиденное. */
  design: DesignName;
  /** Тариф из `?plan=` на кнопке прайса: предвыбирает первый шаг. */
  plan: string | null;
  /** Ниша из `?niche=` на карточке отрасли: предвыбирает шаг «ниша». */
  niche: string | null;
};

/** Из чего собираются начальные ответы квиза: направление и предвыбор из адреса. */
export type InitialBriefAnswersParams = Pick<BriefProps, 'plan' | 'niche'> & { design: string };

export type BriefStatus = 'idle' | 'sending' | 'error';

/** Состояние и действия квиза: квиз каждого направления только рисует на этом хуке. */
export type UseBrief = {
  step: number;
  current: BriefStep;
  isLast: boolean;
  filled: boolean;
  answers: BriefAnswers;
  consent: boolean;
  trap: string;
  status: BriefStatus;
  pick: (field: BriefChoice, value: string) => void;
  write: (
    field: 'name' | 'contact' | 'comment',
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  back: () => void;
  next: () => void;
  send: () => Promise<void>;
  setConsent: (value: boolean) => void;
  setTrap: (value: string) => void;
};
