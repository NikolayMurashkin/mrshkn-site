import type { TerminalLogLine } from './types';

export const TERMINAL_LOG_LINES: TerminalLogLine[] = [
  { key: 'brief', day: null, status: 'ok' },
  { key: 'prepayment', day: null, status: 'ok' },
  { key: 'concept', day: '01', status: 'ok' },
  { key: 'staging', day: '02', status: 'ok' },
  { key: 'lighthouse', day: '03', status: 'ok' },
  { key: 'handover', day: '04', status: 'ok' },
  { key: 'warranty', day: null, status: 'active' },
];

export const ANCHOR_OFFSET = 88;

/** Имя «файла» в строке окна cookie-баннера: декор окна, как в DS, скринридер его не читает. */
export const TERMINAL_COOKIE_FILE = 'cookies.conf';

/** Штриховка паузы на шкале процесса: знаков с запасом на самую широкую паузу, лишнее обрезает полоса. */
export const TERMINAL_SCALE_PAUSE = '░'.repeat(40);
