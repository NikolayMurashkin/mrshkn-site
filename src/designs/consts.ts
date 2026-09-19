import type { DesignName, Theme } from './types';

export const DESIGN_NAMES = ['kinetic', 'terminal', 'pop', 'swiss', 'editorial'] as const;

export const SECTION_NAMES = ['header', 'hero', 'footer'] as const;

export const DEFAULT_DESIGN = 'kinetic' satisfies (typeof DESIGN_NAMES)[number];

export const DESIGN_COOKIE = 'design';

export const DESIGN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DESIGN_SWITCH_TIMEOUT_MS = 4000;

export const DESIGN_LABELS: Record<DesignName, string> = {
  kinetic: 'Kinetic',
  terminal: 'Terminal',
  pop: 'Pop',
  swiss: 'Swiss',
  editorial: 'Editorial',
};

export const DESIGN_DEFAULT_THEME: Record<DesignName, Theme> = {
  kinetic: 'dark',
  terminal: 'dark',
  pop: 'light',
  swiss: 'light',
  editorial: 'light',
};

export const NAV_ITEMS = ['services', 'cases', 'prices', 'contacts'] as const;
