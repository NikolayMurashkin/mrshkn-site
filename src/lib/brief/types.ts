import type { BRIEF_STEPS, LEAD_SOURCE, LEAD_STAGES, UTM_PARAMS } from './consts';

/** Шаг квиза. */
export type BriefStep = (typeof BRIEF_STEPS)[number];

/** Поле с выбором из справочника: у шага «сроки и бюджет» таких два. */
export type BriefChoice = 'product' | 'niche' | 'design' | 'timing' | 'budget';

/** Метки рекламной кампании, снятые с первого перехода на сайт. */
export type UtmMarks = Partial<Record<(typeof UTM_PARAMS)[number], string>>;

/** Заявка, готовая уйти в три канала. Значения шагов — ключи справочников, не переведенный текст. */
export type Lead = {
  source: typeof LEAD_SOURCE;
  product: string;
  niche: string;
  design: string;
  timing: string;
  budget: string;
  name: string;
  contact: string;
  comment: string;
  /** Тариф или его вариант, из которого пришли: `?plan=` на кнопке прайса; null — пришли не из прайса. */
  plan: string | null;
  marks: UtmMarks;
  /** Адрес, с которого ушла заявка: пригодится, когда форм станет больше одной. */
  page: string;
};

/** Что известно о заявке помимо ответов: метки кампании и адрес страницы. */
export type LeadContext = {
  marks: UtmMarks;
  page: string;
};

/** Почему заявка не собралась: ловушка отвечает 200, остальные — 422. */
export type LeadRejection = 'consent' | 'honeypot' | 'fields';

export type LeadParseResult = { ok: true; lead: Lead } | { ok: false; reason: LeadRejection };

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
};

/** Параметры адреса квиза: повтор параметра в адресе приходит массивом. */
export type BriefPresetParams = {
  plan?: string | string[];
  niche?: string | string[];
};

/** Что предвыбрать в квизе: тариф с кнопки прайса и ниша с карточки отрасли; null — без предвыбора. */
export type BriefPreset = {
  plan: string | null;
  niche: string | null;
};

/** Этап заявки в CRM студии. */
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Канал, в который уходит заявка: запись в базу сайта, бот и почта. */
export type LeadChannel = 'crm' | 'telegram' | 'mail';

/** Итог записи заявки в базу: id карточки или ошибка — отказ и таймаут записи. */
export type LeadRecord = { id: number; error: null } | { id: null; error: unknown };
