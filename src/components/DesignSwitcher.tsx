'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  DESIGN_COOKIE,
  DESIGN_COOKIE_MAX_AGE,
  DESIGN_DEFAULT_THEME,
  DESIGN_LABELS,
  DESIGN_NAMES,
  DESIGN_SWITCH_TIMEOUT_MS,
} from '@/designs/consts';
import { preloadDesign } from '@/designs/registry';
import type { DesignName } from '@/designs/types';
import styles from './DesignSwitcher.module.scss';
import { ChevronDownIcon, GlobeIcon } from './icons';
import { forgetStoredTheme, hasStoredTheme } from './theme-storage';

type DesignSwitcherProps = {
  design: DesignName;
};

type PendingSwitch = {
  design: DesignName;
  resolve: () => void;
};

const designCookie = (design: DesignName) =>
  `${DESIGN_COOKIE}=${design}; path=/; max-age=${DESIGN_COOKIE_MAX_AGE}; samesite=lax${
    window.location.protocol === 'https:' ? '; secure' : ''
  }`;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const DesignSwitcher = ({ design }: DesignSwitcherProps) => {
  const t = useTranslations('switcher');
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<PendingSwitch | null>(null);

  useLayoutEffect(() => {
    const pending = pendingRef.current;

    if (pending?.design === design) {
      pendingRef.current = null;
      pending.resolve();
    }
  }, [design]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const apply = (next: DesignName) =>
    new Promise<void>((resolve) => {
      if (!hasStoredTheme()) {
        setTheme(DESIGN_DEFAULT_THEME[next]);
        forgetStoredTheme();
      }

      pendingRef.current?.resolve();
      pendingRef.current = { design: next, resolve };
      window.setTimeout(resolve, DESIGN_SWITCH_TIMEOUT_MS);
      document.cookie = designCookie(next);
      router.refresh();
    });

  const select = (next: DesignName) => {
    setOpen(false);

    if (next === design) {
      return;
    }

    void preloadDesign(next);

    if (typeof document.startViewTransition === 'function' && !prefersReducedMotion()) {
      document.startViewTransition(() => apply(next));
    } else {
      void apply(next);
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
    >
      {open && (
        <ul
          className={styles.menu}
          data-testid="design-menu"
        >
          {DESIGN_NAMES.map((name) => (
            <li key={name}>
              <button
                type="button"
                className={name === design ? styles.itemActive : styles.item}
                onClick={() => select(name)}
              >
                {DESIGN_LABELS[name]}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={styles.pill}
        data-testid="design-switcher"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <GlobeIcon size={16} />
        <span className={styles.label}>
          {t('label')}: {DESIGN_LABELS[design]}
        </span>
        <ChevronDownIcon size={14} />
      </button>
    </div>
  );
};
