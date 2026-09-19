'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { rememberTheme } from './theme-storage';

type ThemeToggleProps = {
  className?: string;
  children: ReactNode;
};

export const ThemeToggle = ({ className, children }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('controls');

  const toggle = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';

    setTheme(next);
    rememberTheme(next);
  };

  return (
    <button
      type="button"
      className={className}
      data-testid="theme-toggle"
      aria-label={t('theme')}
      onClick={toggle}
    >
      {children}
    </button>
  );
};
