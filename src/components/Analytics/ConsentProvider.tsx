'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearedConsentCookie, consentCookie } from '@/lib/analytics/consent';
import { UNTRACKED_PATH } from '@/lib/analytics/consts';
import { reachGoal } from '@/lib/analytics/goals';
import type { ConsentChoice, Goal } from '@/lib/analytics/types';
import { AnalyticsScripts } from './AnalyticsScripts';
import { ConsentContext } from './context';
import type { ConsentProviderProps } from './types';

/**
 * Согласие на счетчики: «Принять» дорисовывает их без перезагрузки. Код загруженного счетчика из страницы не выгрузить →
 * отказ или сброс после загрузки перезагружает страницу, и она приходит уже без счетчиков. На страницах
 * `UNTRACKED_PATH` счетчиков нет и при согласии.
 */
export const ConsentProvider = ({ initialChoice, metrikaId, gaId, children }: ConsentProviderProps) => {
  const [choice, setChoice] = useState(initialChoice);
  const loaded = useRef(false);
  const pathname = usePathname();
  const granted = choice === 'granted' && !UNTRACKED_PATH.test(pathname);
  const counting = granted && Boolean(metrikaId || gaId);

  useEffect(() => {
    if (counting) {
      loaded.current = true;
    }
  }, [counting]);

  const choose = useCallback((next: ConsentChoice) => {
    document.cookie = consentCookie(next);

    if (next === 'denied' && loaded.current) {
      window.location.reload();

      return;
    }

    setChoice(next);
  }, []);

  const reopen = useCallback(() => {
    document.cookie = clearedConsentCookie();

    if (loaded.current) {
      window.location.reload();

      return;
    }

    setChoice(null);
  }, []);

  const goal = useCallback((name: Goal) => reachGoal(name, metrikaId), [metrikaId]);

  const value = useMemo(() => ({ choice, choose, reopen, reachGoal: goal }), [choice, choose, reopen, goal]);

  return (
    <ConsentContext value={value}>
      {children}
      <AnalyticsScripts
        consent={granted}
        metrikaId={metrikaId}
        gaId={gaId}
      />
    </ConsentContext>
  );
};
