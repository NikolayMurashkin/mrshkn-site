'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import { KineticReview } from '../kinetic/KineticReview';
import './fonts';
import { PopCase } from './Case';
import { PopCookieBanner } from './CookieBanner';
import { PopFooter } from './Footer';
import { PopHeader } from './Header';
import { PopHero } from './Hero';
import { PopBrief } from './PopBrief';
import { PopBriefThanks } from './PopBriefThanks';
import { PopPricing } from './Pricing';
import { PopPrivacyPage } from './PrivacyPage';
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
  privacyPage: PopPrivacyPage,
  cookieBanner: PopCookieBanner,
  review: KineticReview,
};

export const PopSection = (props: SectionProps) => renderSection(COMPONENTS, props);
