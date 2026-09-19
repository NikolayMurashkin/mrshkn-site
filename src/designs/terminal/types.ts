/** Строка панели build.log в hero Terminal. */
export type TerminalLogLine = {
  /** Ключ текста строки в `hero.terminal.log`. */
  key: 'brief' | 'prepayment' | 'concept' | 'staging' | 'lighthouse' | 'handover' | 'warranty';
  /** Номер дня в квадратных скобках; null — строка без дня (гарантия). */
  day: string | null;
  /** Статус в конце строки: `ok` зеленым, `active` акцентом с курсором. */
  status: 'ok' | 'active';
};
