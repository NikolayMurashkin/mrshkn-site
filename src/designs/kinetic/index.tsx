'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import './fonts';
import { KineticCase } from './Case';
import { KineticFooter } from './Footer';
import { KineticHeader } from './Header';
import { KineticHero } from './Hero';
import { KineticBrief } from './KineticBrief';
import { KineticBriefThanks } from './KineticBriefThanks';
import { KineticPricing } from './Pricing';
import { KineticProcess } from './Process';
import { KineticServicePage } from './ServicePage';
import { KineticWorks } from './Works';

const COMPONENTS: DesignComponents = {
  header: KineticHeader,
  hero: KineticHero,
  pricing: KineticPricing,
  works: KineticWorks,
  process: KineticProcess,
  case: KineticCase,
  footer: KineticFooter,
  brief: KineticBrief,
  briefThanks: KineticBriefThanks,
  servicePage: KineticServicePage,
};

export const KineticSection = (props: SectionProps) => renderSection(COMPONENTS, props);
