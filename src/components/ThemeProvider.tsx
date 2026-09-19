'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';
import type { Theme } from '@/designs/types';
import { THEME_STORAGE_KEY } from './consts';

type ThemeProviderProps = {
  defaultTheme: Theme;
  children: ReactNode;
};

export const ThemeProvider = ({ defaultTheme, children }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="data-theme"
    defaultTheme={defaultTheme}
    storageKey={THEME_STORAGE_KEY}
    enableSystem={false}
    disableTransitionOnChange
  >
    {children}
  </NextThemesProvider>
);
