'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import './fonts';
import { TerminalCase } from './Case';
import { TerminalFooter } from './Footer';
import { TerminalHeader } from './Header';
import { TerminalHero } from './Hero';
import { TerminalPricing } from './Pricing';
import { TerminalProcess } from './Process';
import { TerminalServicePage } from './ServicePage';
import { TerminalBrief } from './TerminalBrief';
import { TerminalBriefThanks } from './TerminalBriefThanks';
import { TerminalWorks } from './Works';

const COMPONENTS: DesignComponents = {
  header: TerminalHeader,
  hero: TerminalHero,
  pricing: TerminalPricing,
  works: TerminalWorks,
  process: TerminalProcess,
  case: TerminalCase,
  footer: TerminalFooter,
  brief: TerminalBrief,
  briefThanks: TerminalBriefThanks,
  servicePage: TerminalServicePage,
};

export const TerminalSection = (props: SectionProps) => renderSection(COMPONENTS, props);
