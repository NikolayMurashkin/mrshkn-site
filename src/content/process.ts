import type { ProcessScaleSegment } from './types';

/**
 * График лендинга и четыре обещания: порядок и опорные числа здесь, тексты — в messages.
 * Дни — календарные дни лендинга: по шагу на день, правки и паузы на ответ заказчика — внутри шагов.
 */
export const PROCESS_STEPS = [
  { id: 'brief', day: 1 },
  { id: 'concept', day: 2 },
  { id: 'staging', day: 3 },
  { id: 'launch', day: 4 },
] as const;

/** Четыре проверяемых обещания: срок, качество, цена, гарантия. */
export const PROMISES = ['deadline', 'quality', 'price', 'warranty'] as const;

/**
 * Шкала «дни и паузы» графика лендинга: выбор стиля до дня 1, после каждого дня — пауза, пока заказчик
 * смотрит работу; срок в паузах стоит. Платежи 30 / 40 / 30 — на выборе стиля, третьем раунде правок и приемке.
 */
export const PROCESS_SCALE: readonly ProcessScaleSegment[] = [
  { kind: 'style', payment: 'prepayment' },
  { kind: 'day', day: 1 },
  { kind: 'pause', pause: 'round1' },
  { kind: 'day', day: 2 },
  { kind: 'pause', pause: 'round2' },
  { kind: 'day', day: 3 },
  { kind: 'pause', pause: 'round3', payment: 'second' },
  { kind: 'day', day: 4 },
  { kind: 'pause', pause: 'acceptance', payment: 'final' },
];
