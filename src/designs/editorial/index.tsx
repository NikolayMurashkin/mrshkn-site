'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import './fonts';
import { EditorialCase } from './Case';
import { EditorialBrief } from './EditorialBrief';
import { EditorialBriefThanks } from './EditorialBriefThanks';
import { EditorialFooter } from './Footer';
import { EditorialHeader } from './Header';
import { EditorialHero } from './Hero';
import { EditorialPricing } from './Pricing';
import { EditorialProcess } from './Process';
import { EditorialServicePage } from './ServicePage';
import { EditorialTeam } from './Team';
import { EditorialWorks } from './Works';

const COMPONENTS: DesignComponents = {
  header: EditorialHeader,
  hero: EditorialHero,
  pricing: EditorialPricing,
  works: EditorialWorks,
  process: EditorialProcess,
  team: EditorialTeam,
  case: EditorialCase,
  footer: EditorialFooter,
  brief: EditorialBrief,
  briefThanks: EditorialBriefThanks,
  servicePage: EditorialServicePage,
};

export const EditorialSection = (props: SectionProps) => renderSection(COMPONENTS, props);
