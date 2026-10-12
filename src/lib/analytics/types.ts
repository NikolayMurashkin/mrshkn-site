import type { CONSENT_VALUES, GOALS } from './consts';

/** Выбор посетителя в cookie-баннере. */
export type ConsentChoice = (typeof CONSENT_VALUES)[number];

/** Имя цели Метрики и события GA4. */
export type Goal = (typeof GOALS)[keyof typeof GOALS];

/** ID счетчиков из переменных среды: нет ID — нет счетчика. */
export type AnalyticsIds = {
  metrikaId: string | null;
  gaId: string | null;
};
