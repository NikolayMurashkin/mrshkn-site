'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

type ThemeToggleProps = {
  className?: string;
  children: ReactNode;
};

export const ThemeToggle = ({ className, children }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('controls');

  return (
    <button
      type="button"
      className={className}
      data-testid="theme-toggle"
      aria-label={t('theme')}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {children}
    </button>
  );
};
