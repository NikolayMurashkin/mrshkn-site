import { cookies } from 'next/headers';
import { DESIGN_DEFAULT_THEME } from '@/designs/consts';
import type { DesignName, Theme } from '@/designs/types';
import { THEME_COOKIE } from './consts';
import { isTheme } from './theme-storage';

export const getTheme = async (design: DesignName): Promise<Theme> => {
  const stored = (await cookies()).get(THEME_COOKIE)?.value;

  return isTheme(stored) ? stored : DESIGN_DEFAULT_THEME[design];
};
