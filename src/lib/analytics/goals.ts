type CounterWindow = {
  ym?: (id: string, action: 'reachGoal', goal: string) => void;
  gtag?: (command: 'event', goal: string) => void;
};

/** Шлет цель в счетчики, которые успели загрузиться; без согласия их нет, и вызов ничего не делает. */
export const reachGoal = (goal: string, metrikaId: string | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const counters = window as CounterWindow;

  if (metrikaId && typeof counters.ym === 'function') {
    counters.ym(metrikaId, 'reachGoal', goal);
  }

  if (typeof counters.gtag === 'function') {
    counters.gtag('event', goal);
  }
};
