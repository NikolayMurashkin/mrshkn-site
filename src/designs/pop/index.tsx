'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import './fonts';
import { PopCase } from './Case';
import { PopFooter } from './Footer';
import { PopHeader } from './Header';
import { PopHero } from './Hero';
import { PopBrief } from './PopBrief';
import { PopBriefThanks } from './PopBriefThanks';
import { PopPricing } from './Pricing';
import { PopProcess } from './Process';
import { PopServicePage } from './ServicePage';
import { PopWorks } from './Works';

const COMPONENTS: DesignComponents = {
  header: PopHeader,
  hero: PopHero,
  pricing: PopPricing,
  works: PopWorks,
  process: PopProcess,
  case: PopCase,
  footer: PopFooter,
  brief: PopBrief,
  briefThanks: PopBriefThanks,
  servicePage: PopServicePage,
};

export const PopSection = (props: SectionProps) => renderSection(COMPONENTS, props);
