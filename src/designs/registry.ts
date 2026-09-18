import type { ComponentType } from 'react';
import { DEFAULT_DESIGN, DESIGN_NAMES } from './consts';
import { KineticHero } from './kinetic/Hero';
import type { DesignName, DesignRegistry, SectionName } from './types';

const FALLBACK_SECTIONS: Record<SectionName, ComponentType> = {
  hero: KineticHero,
};

const REGISTRY: DesignRegistry = {
  kinetic: { hero: KineticHero },
  terminal: {},
  pop: {},
  swiss: {},
  editorial: {},
};

const isDesignName = (value: unknown): value is DesignName =>
  typeof value === 'string' && (DESIGN_NAMES as readonly string[]).includes(value);

export const resolveDesign = (value?: string | null): DesignName => (isDesignName(value) ? value : DEFAULT_DESIGN);

export const getSection = (design: string | null | undefined, section: SectionName): ComponentType =>
  REGISTRY[resolveDesign(design)][section] ?? FALLBACK_SECTIONS[section];
