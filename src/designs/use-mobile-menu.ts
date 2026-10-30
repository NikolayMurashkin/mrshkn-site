import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { FOCUSABLE_SELECTOR, MOBILE_MENU_ID, MOBILE_MENU_TOP_PROPERTY } from './consts';
import type { MobileMenu } from './types';

const isFocusable = (element: HTMLElement) =>
  element.tabIndex >= 0 && element.getAttribute('tabindex') !== '-1' && !element.closest('[hidden], [inert]');

/** Круг фокуса открытого меню: крестик и все, что можно выбрать Tab внутри панели, по порядку DOM. */
const focusCircle = (burger: HTMLElement | null, panel: HTMLElement | null) => [
  ...(burger ? [burger] : []),
  ...[...(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])].filter(isFocusable),
];

/**
 * Мобильное меню шапки на окне не шире `maxWidth` (включительно — как `max-width` в CSS направления). Открытое
 * держит фокус по кругу «крестик + панель» (Tab ведет хук сам: меню и переключатели шапки скрыты только CSS)
 * и блокирует прокрутку страницы инлайн `overflow: hidden` у `<html>`. Крестик, Esc и пункт панели закрывают
 * меню и возвращают фокус на бургер без прокрутки — у Editorial на телефоне шапка уезжает. Окно шире порога,
 * смена адреса («Назад» браузера: шапка живет в layout и при переходе не пересоздается) и ссылка шапки вне панели
 * (знак, CTA — закрывают и на том же адресе) закрывают меню без фокуса: он уходит со страницей.
 */
export const useMobileMenu = (maxWidth: number): MobileMenu => {
  const t = useTranslations('header');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const burger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);

    if (restoreFocus) {
      burger.current?.focus({ preventScroll: true });
    }
  }, []);

  const toggle = useCallback(() => {
    if (open) {
      close(true);
    } else {
      setOpen(true);
    }
  }, [open, close]);

  const onNavigate = useCallback(() => close(true), [close]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, scrollbarGutter: root.style.scrollbarGutter };

    root.style.overflow = 'hidden';
    root.style.scrollbarGutter = 'stable';

    return () => {
      root.style.overflow = previous.overflow;
      root.style.scrollbarGutter = previous.scrollbarGutter;
    };
  }, [open]);

  useLayoutEffect(() => {
    const node = panel.current;

    if (!open || !node) {
      return;
    }

    const place = () => {
      const bottom = burger.current?.closest('header')?.getBoundingClientRect().bottom;

      if (bottom !== undefined) {
        node.style.setProperty(MOBILE_MENU_TOP_PROPERTY, `${Math.max(bottom, 0)}px`);
      }
    };

    place();
    window.addEventListener('resize', place);

    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (open) {
      focusCircle(null, panel.current)[0]?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    if (!open || typeof window.matchMedia !== 'function') {
      return;
    }

    const list = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = () => {
      if (!list.matches) {
        close(false);
      }
    };

    list.addEventListener('change', onChange);

    return () => list.removeEventListener('change', onChange);
  }, [open, maxWidth, close]);

  useEffect(() => {
    const header = burger.current?.closest('header');

    if (!open || !header) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;

      if (link && !panel.current?.contains(link)) {
        close(false);
      }
    };

    header.addEventListener('click', onClick);

    return () => header.removeEventListener('click', onClick);
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close(true);

        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const circle = focusCircle(burger.current, panel.current);

      if (circle.length === 0) {
        return;
      }

      const index = circle.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      const next =
        index === -1
          ? circle[event.shiftKey ? circle.length - 1 : 0]
          : circle[(index + step + circle.length) % circle.length];

      event.preventDefault();
      next.focus();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  return {
    open,
    burgerProps: {
      ref: burger,
      type: 'button',
      'aria-expanded': open,
      'aria-controls': MOBILE_MENU_ID,
      'aria-label': t(open ? 'menuClose' : 'menuOpen'),
      onClick: toggle,
    },
    panelProps: { ref: panel, id: MOBILE_MENU_ID, hidden: !open },
    onNavigate,
  };
};
