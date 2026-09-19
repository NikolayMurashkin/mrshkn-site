import { cookies } from 'next/headers';
import { DESIGN_DEFAULT_THEME } from '@/designs/consts';
import type { DesignName, Theme } from '@/designs/types';
import { THEME_COOKIE } from './consts';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

export const getTheme = async (design: DesignName): Promise<Theme> => {
  const stored = (await cookies()).get(THEME_COOKIE)?.value;

  return isTheme(stored) ? stored : DESIGN_DEFAULT_THEME[design];
};
