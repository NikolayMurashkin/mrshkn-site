import { PROCESS_STEPS } from '@/content/process';
import type { TerminalLogLine } from './types';

export const TERMINAL_LOG_LINES: TerminalLogLine[] = [
  { key: 'brief', day: '01', status: 'ok' },
  { key: 'prepayment', day: '01', status: 'ok' },
  { key: 'concept', day: '03', status: 'ok' },
  { key: 'staging', day: '10', status: 'ok' },
  { key: 'lighthouse', day: '14', status: 'ok' },
  { key: 'handover', day: '14', status: 'ok' },
  { key: 'warranty', day: null, status: 'active' },
];

export const ANCHOR_OFFSET = 88;

export const PROCESS_SCALE_DAYS = Array.from({ length: 14 }, (_, index) => index + 1);

export const PROCESS_KEY_DAYS: ReadonlySet<number> = new Set(PROCESS_STEPS.map((step) => step.day));

/** Имя «файла» в строке окна cookie-баннера: декор окна, как в DS, скринридер его не читает. */
export const TERMINAL_COOKIE_FILE = 'cookies.conf';
