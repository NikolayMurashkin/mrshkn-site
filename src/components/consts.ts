import type { ProcessPayment } from '@/content/types';
import type { ProcessScaleLegendEntry } from './types';

export const THEME_STORAGE_KEY = 'theme';

export const THEME_COOKIE = 'theme';

export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Подсказки `sizes` для картинок кейса: ширина слота при гриде в три, две и одну колонку. */
export const CASE_CARD_SIZES = '(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw';

export const CASE_COVER_SIZES = '(max-width: 1200px) 100vw, 1200px';

export const CASE_SHOT_SIZES = '(max-width: 1000px) 100vw, 960px';

/**
 * Отказы `play()`, которые не ошибка: браузер не дал запустить ролик сам (остаются кнопки плеера)
 * или запуск прервала пауза либо смена `src`.
 */
export const EXPECTED_PLAY_ERRORS: readonly string[] = ['NotAllowedError', 'AbortError'];

/** Платежи шкалы процесса, которые стоят в конце отрезка: последние 30 % — после приемки. */
export const PROCESS_PAYMENTS_AT_END: readonly ProcessPayment[] = ['final'];

/** Легенда шкалы: выбор стиля, рабочий день, пауза — ключ подписи `process.scale.legend.*`. */
export const PROCESS_SCALE_LEGEND: readonly ProcessScaleLegendEntry[] = [
  { kind: 'style', key: 'style' },
  { kind: 'day', key: 'work' },
  { kind: 'pause', key: 'pause' },
];
