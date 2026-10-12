'use client';

import { useContext, useEffect, useRef } from 'react';
import { BANNER_SPACE_VAR } from './consts';
import { ConsentContext } from './context';
import type { UseCookieBanner } from './types';

export const useConsent = () => useContext(ConsentContext);

/** Цель в счетчики с ID Метрики из провайдера: верстке направлений ID знать не нужно. */
export const useGoal = () => useContext(ConsentContext).reachGoal;

/**
 * Логика баннера, общая для пяти направлений. Пока баннер виден, у страницы снизу запас на его высоту
 * (переменная на `<html>`, ее читает `body`) → низ квиза и подвал прокручиваются выше баннера.
 */
export const useCookieBanner = (): UseCookieBanner => {
  const { choice, choose } = useContext(ConsentContext);
  const ref = useRef<HTMLElement | null>(null);
  const visible = choice === null;

  useEffect(() => {
    const node = ref.current;

    if (!visible || !node) {
      return;
    }

    const root = document.documentElement;
    const update = () =>
      root.style.setProperty(BANNER_SPACE_VAR, `${Math.ceil(window.innerHeight - node.getBoundingClientRect().top)}px`);
    const observer = new ResizeObserver(update);

    observer.observe(node);
    window.addEventListener('resize', update, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty(BANNER_SPACE_VAR);
    };
  }, [visible]);

  return {
    visible,
    ref,
    accept: () => choose('granted'),
    decline: () => choose('denied'),
  };
};
