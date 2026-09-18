export const DESIGN_NAMES = ['kinetic', 'terminal', 'pop', 'swiss', 'editorial'] as const;

export const SECTION_NAMES = ['hero'] as const;

export const DEFAULT_DESIGN = 'kinetic' satisfies (typeof DESIGN_NAMES)[number];
