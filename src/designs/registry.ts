import type { ComponentType } from 'react';
import { DEFAULT_DESIGN, DESIGN_NAMES } from './consts';
import { EditorialFooter } from './editorial/Footer';
import { EditorialHeader } from './editorial/Header';
import { KineticFooter } from './kinetic/Footer';
import { KineticHeader } from './kinetic/Header';
import { KineticHero } from './kinetic/Hero';
import { PopFooter } from './pop/Footer';
import { PopHeader } from './pop/Header';
import { SwissFooter } from './swiss/Footer';
import { SwissHeader } from './swiss/Header';
import { TerminalFooter } from './terminal/Footer';
import { TerminalHeader } from './terminal/Header';
import type { DesignName, DesignRegistry, SectionName } from './types';

const FALLBACK_SECTIONS: Record<SectionName, ComponentType> = {
  header: KineticHeader,
  hero: KineticHero,
  footer: KineticFooter,
};

const REGISTRY: DesignRegistry = {
  kinetic: { header: KineticHeader, hero: KineticHero, footer: KineticFooter },
  terminal: { header: TerminalHeader, footer: TerminalFooter },
  pop: { header: PopHeader, footer: PopFooter },
  swiss: { header: SwissHeader, footer: SwissFooter },
  editorial: { header: EditorialHeader, footer: EditorialFooter },
};

const isDesignName = (value: unknown): value is DesignName =>
  typeof value === 'string' && (DESIGN_NAMES as readonly string[]).includes(value);

export const resolveDesign = (value?: string | null): DesignName => (isDesignName(value) ? value : DEFAULT_DESIGN);

export const getSection = (design: string | null | undefined, section: SectionName): ComponentType =>
  REGISTRY[resolveDesign(design)][section] ?? FALLBACK_SECTIONS[section];
