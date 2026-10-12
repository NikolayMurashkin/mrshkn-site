'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import './fonts';
import { SwissCase } from './Case';
import { SwissFooter } from './Footer';
import { SwissHeader } from './Header';
import { SwissHero } from './Hero';
import { SwissPricing } from './Pricing';
import { SwissProcess } from './Process';
import { SwissServicePage } from './ServicePage';
import { SwissBrief } from './SwissBrief';
import { SwissBriefThanks } from './SwissBriefThanks';
import { SwissWorks } from './Works';

const COMPONENTS: DesignComponents = {
  header: SwissHeader,
  hero: SwissHero,
  pricing: SwissPricing,
  works: SwissWorks,
  process: SwissProcess,
  case: SwissCase,
  footer: SwissFooter,
  brief: SwissBrief,
  briefThanks: SwissBriefThanks,
  servicePage: SwissServicePage,
};

export const SwissSection = (props: SectionProps) => renderSection(COMPONENTS, props);
