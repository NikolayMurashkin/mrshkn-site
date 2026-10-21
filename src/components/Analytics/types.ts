import type { ReactNode, RefObject } from 'react';
import type { ConsentChoice, Goal } from '@/lib/analytics/types';

export type AnalyticsScriptsProps = {
  consent: boolean;
  metrikaId?: string | null;
  gaId?: string | null;
};

export type ConsentProviderProps = {
  /** Выбор из cookie на запросе: баннер виден или скрыт уже в HTML сервера, без сдвига после гидрации. */
  initialChoice: ConsentChoice | null;
  metrikaId: string | null;
  gaId: string | null;
  children: ReactNode;
};

/** Состояние согласия на странице: выбор, его смена и отправка целей в счетчики. */
export type ConsentState = {
  choice: ConsentChoice | null;
  /** Баннер снова открыт кнопкой «Изменить выбор», а не показан при первом визите: ему можно забрать фокус. */
  reopened: boolean;
  choose: (choice: ConsentChoice) => void;
  /** Стирает выбор и снова показывает баннер — кнопка «Изменить выбор» в политике. */
  reopen: () => void;
  reachGoal: (goal: Goal) => void;
};

/** Что нужно верстке баннера любого направления. */
export type UseCookieBanner = {
  visible: boolean;
  ref: RefObject<HTMLElement | null>;
  accept: () => void;
  decline: () => void;
};
