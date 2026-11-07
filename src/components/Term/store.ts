import type { TermMode, TermOpen } from './types';

let current: TermOpen | null = null;

const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

/** Открыта одна подсказка на странице: открытие новой закрывает прежнюю. */
export const subscribeTerm = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const termModeOf = (tipId: string): TermMode | null => (current?.tipId === tipId ? current.mode : null);

export const openTerm = (tipId: string, mode: TermMode) => {
  if (current?.tipId === tipId && current.mode === mode) {
    return;
  }

  current = { tipId, mode };
  emit();
};

export const closeTerm = (tipId: string) => {
  if (current?.tipId !== tipId) {
    return;
  }

  current = null;
  emit();
};
