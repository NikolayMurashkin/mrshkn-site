import { useEffect, useRef } from 'react';

/**
 * Заголовок шага квиза после «Далее» и «Назад»: докрутка к нему и фокус, чтобы клавиатура и скринридер начинали
 * с нового шага. Первый показ фокус не трогает — страница решает сама. Заголовку нужен `tabIndex={-1}`.
 */
export const useStepFocus = (step: number) => {
  const stepTitle = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  useEffect(() => {
    if (shownStep.current === step) {
      return;
    }

    shownStep.current = step;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stepTitle.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    stepTitle.current?.focus({ preventScroll: true });
  }, [step]);

  return stepTitle;
};
