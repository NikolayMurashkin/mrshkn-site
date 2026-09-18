export const DESIGN_NAMES = ['kinetic', 'terminal', 'pop', 'swiss', 'editorial'] as const;

export const SECTION_NAMES = ['header', 'hero', 'footer'] as const;

export const DEFAULT_DESIGN = 'kinetic' satisfies (typeof DESIGN_NAMES)[number];

export const DESIGN_COOKIE = 'design';

export const NAV_ITEMS = ['services', 'cases', 'prices', 'contacts'] as const;
