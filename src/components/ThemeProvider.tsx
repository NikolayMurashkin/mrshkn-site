'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect, type ReactNode } from 'react';
import type { Theme } from '@/designs/types';
import { THEME_STORAGE_KEY } from './consts';
import { hasStoredTheme, isTheme, rememberTheme } from './theme-storage';

type ThemeProviderProps = {
  defaultTheme: Theme;
  children: ReactNode;
};

const ThemeCookieSync = () => {
  const { theme } = useTheme();

  useEffect(() => {
    if (isTheme(theme) && hasStoredTheme()) {
      rememberTheme(theme);
    }
  }, [theme]);

  return null;
};

export const ThemeProvider = ({ defaultTheme, children }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="data-theme"
    defaultTheme={defaultTheme}
    storageKey={THEME_STORAGE_KEY}
    enableSystem={false}
    disableTransitionOnChange
  >
    <ThemeCookieSync />
    {children}
  </NextThemesProvider>
);
