'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import './fonts';
import { EditorialCase } from './Case';
import { EditorialFooter } from './Footer';
import { EditorialHeader } from './Header';
import { EditorialHero } from './Hero';
import { EditorialPricing } from './Pricing';
import { EditorialProcess } from './Process';
import { EditorialWorks } from './Works';

const COMPONENTS: DesignComponents = {
  header: EditorialHeader,
  hero: EditorialHero,
  pricing: EditorialPricing,
  works: EditorialWorks,
  process: EditorialProcess,
  case: EditorialCase,
  footer: EditorialFooter,
};

export const EditorialSection = (props: SectionProps) => renderSection(COMPONENTS, props);
