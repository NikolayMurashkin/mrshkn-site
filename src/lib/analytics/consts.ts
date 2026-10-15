import { LOCALES } from '@/i18n/consts';

/** Cookie выбора посетителя по счетчикам: `granted` или `denied`; нет cookie — выбора не было, баннер показан. */
export const CONSENT_COOKIE = 'consent';

/** Выбор помнится год, затем баннер спрашивает снова. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export const CONSENT_VALUES = ['granted', 'denied'] as const;

/**
 * Цели Метрики и события GA4 с одинаковыми именами. Переход в Telegram — клик по кнопке «Написать в Telegram»
 * в подвале любого направления (`TelegramLink`).
 */
export const GOALS = {
  quizStart: 'quiz_start',
  quizComplete: 'quiz_complete',
  planClick: 'plan_click',
  telegramClick: 'telegram_click',
} as const;

export const METRIKA_TAG_SRC = 'https://mc.yandex.ru/metrika/tag.js';

export const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js';

/** ID попадают в код счетчиков → в разметку идут только ID своего формата, а не что угодно из переменной среды. */
export const METRIKA_ID_PATTERN = /^\d{1,12}$/;

export const GA_ID_PATTERN = /^G-[A-Z0-9]{4,16}$/;

/** Настройки Метрики: карта кликов и ссылки, без Вебвизора — он записывает действия посетителя целиком. */
export const METRIKA_OPTIONS = { clickmap: true, trackLinks: true, accurateTrackBounce: true };

/**
 * Страницы без счетчиков: счетчики шлют адрес целиком, а в адресе страницы отзыва — код личной ссылки, он же пропуск
 * к форме.
 */
export const UNTRACKED_PATH = new RegExp(`^/(${LOCALES.join('|')})/review(/|$)`);
