import { DEFAULT_DESIGN, DESIGN_NAMES } from './consts';
import type { DesignName } from './types';

const isDesignName = (value: unknown): value is DesignName =>
  typeof value === 'string' && (DESIGN_NAMES as readonly string[]).includes(value);

export const resolveDesign = (value?: string | null): DesignName => (isDesignName(value) ? value : DEFAULT_DESIGN);
