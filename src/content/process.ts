/**
 * Две недели проекта и четыре обещания из D4: порядок и опорные числа здесь, тексты — в messages.
 * Дни совпадают с таймлайном на артбордах: 1 / 3 / 10 / 14.
 */
export const PROCESS_STEPS = [
  { id: 'brief', day: 1 },
  { id: 'concept', day: 3 },
  { id: 'staging', day: 10 },
  { id: 'launch', day: 14 },
] as const;

/** Четыре проверяемых обещания D4: срок, качество, цена, гарантия. */
export const PROMISES = ['deadline', 'quality', 'price', 'warranty'] as const;
