'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type FocusEvent,
  type PointerEvent,
} from 'react';
import { TERM_TOOLTIP_GAP } from '@/lib/glossary/consts';
import { placeTooltip } from '@/lib/glossary/placement';
import type { TooltipSize } from '@/lib/glossary/types';
import { TERM_TOUCH_MOUSE_WINDOW } from './consts';
import { closeTerm, openTerm, subscribeTerm, termModeOf } from './store';
import type { TermProps } from './types';

let lastTouchAt = -Infinity;

const serverMode = () => null;

const callPopover = (tip: HTMLElement, method: 'showPopover' | 'hidePopover') => {
  if (typeof tip[method] !== 'function') {
    return;
  }

  try {
    tip[method]();
  } catch {
    return;
  }
};

const viewportOf = () => ({
  width: document.documentElement.clientWidth || window.innerWidth,
  height: document.documentElement.clientHeight || window.innerHeight,
});

/** Размер подсказки без трансформаций: анимация появления (масштаб, сдвиг) и наклон не сбивают замер. */
const sizeOf = (tip: HTMLElement) => ({ width: tip.offsetWidth, height: tip.offsetHeight });

/**
 * Размер подсказки после стилей направления; шире окна — сужение до предела `placeTooltip` и повторный замер. Нужен
 * при открытии и при смене окна: на прокрутке размер тот же, место считается по сохраненному.
 */
const measure = (button: HTMLElement, tip: HTMLElement): TooltipSize => {
  tip.style.removeProperty('max-width');

  const size = sizeOf(tip);
  const { maxWidth } = placeTooltip({ anchor: button.getBoundingClientRect(), tip: size, viewport: viewportOf() });

  if (size.width <= maxWidth) {
    return size;
  }

  tip.style.maxWidth = `${maxWidth}px`;

  return sizeOf(tip);
};

/**
 * Подсказка в координатах окна по сохраненному размеру — `placeTooltip`. Сторона (`data-side`) и зазор (`--term-gap`) —
 * для мостика, по которому мышь со слова доходит до подсказки.
 */
const position = (button: HTMLElement, tip: HTMLElement, size: TooltipSize) => {
  const placement = placeTooltip({ anchor: button.getBoundingClientRect(), tip: size, viewport: viewportOf() });

  tip.style.left = `${placement.left}px`;
  tip.style.top = `${placement.top}px`;
  tip.style.setProperty('--term-gap', `${TERM_TOOLTIP_GAP}px`);
  tip.dataset.side = placement.side;
};

/**
 * Слово с подсказкой: кнопка и подсказка `role="tooltip"` рядом, в разметке сервера закрытая (`hidden`). Наведение мыши
 * и фокус с клавиатуры открывают, нажатие закрепляет или закрывает; Escape и нажатие мимо закрывают. Открытая
 * подсказка — в верхнем слое браузера (`popover`), едет за словом при прокрутке.
 */
export const Term = ({ id, text, classes, nowrap = false, nowrapClassName, children }: TermProps) => {
  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const pointerRef = useRef(false);
  const mode = useSyncExternalStore(subscribeTerm, () => termModeOf(tipId), serverMode);
  const isOpen = mode !== null;

  const close = useCallback(() => closeTerm(tipId), [tipId]);

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const tip = tipRef.current;

    if (!isOpen || !button || !tip) {
      return;
    }

    callPopover(tip, 'showPopover');

    let size = measure(button, tip);
    let resized = false;
    let frame = 0;

    position(button, tip, size);

    const schedule = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(() => {
          frame = 0;

          if (resized) {
            resized = false;
            size = measure(button, tip);
          }

          position(button, tip, size);
        });
      }
    };
    const onResize = () => {
      resized = true;
      schedule();
    };

    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', onResize);
      callPopover(tip, 'hidePopover');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Node) || !rootRef.current?.contains(event.target)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close]);

  useEffect(() => close, [close]);

  const onMouseEnter = () => {
    if (performance.now() - lastTouchAt >= TERM_TOUCH_MOUSE_WINDOW && mode === null) {
      openTerm(tipId, 'hover');
    }
  };

  const onMouseLeave = () => {
    if (mode === 'hover') {
      close();
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== 'mouse') {
      lastTouchAt = performance.now();
    }

    if (event.target instanceof Node && buttonRef.current?.contains(event.target)) {
      pointerRef.current = true;
    }
  };

  const onFocus = () => {
    if (pointerRef.current) {
      pointerRef.current = false;

      return;
    }

    if (mode === null) {
      openTerm(tipId, 'focus');
    }
  };

  const onBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const next = event.relatedTarget;
    const leftRoot = next instanceof Node && !rootRef.current?.contains(next);

    if (mode === 'focus' || (mode === 'pin' && leftRoot)) {
      close();
    }
  };

  const onClick = () => {
    pointerRef.current = false;

    if (mode === 'pin') {
      close();
    } else {
      openTerm(tipId, 'pin');
    }
  };

  return (
    <span
      className={classes.root}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      ref={rootRef}
    >
      <button
        aria-describedby={tipId}
        className={classes.button}
        data-term={id}
        onBlur={onBlur}
        onClick={onClick}
        onFocus={onFocus}
        ref={buttonRef}
        type="button"
      >
        {nowrap ? <span className={nowrapClassName}>{children}</span> : children}
      </button>
      <span
        className={classes.tooltip}
        hidden={!isOpen}
        id={tipId}
        popover="manual"
        ref={tipRef}
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
};
