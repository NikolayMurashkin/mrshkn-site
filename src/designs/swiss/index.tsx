'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import { KineticReview } from '../kinetic/KineticReview';
import './fonts';
import { SwissAudit } from './Audit';
import { SwissCase } from './Case';
import { SwissCookieBanner } from './CookieBanner';
import { SwissFooter } from './Footer';
import { SwissHeader } from './Header';
import { SwissHero } from './Hero';
import { SwissPricing } from './Pricing';
import { SwissLegalPage } from './LegalPage';
import { SwissPrivacyPage } from './PrivacyPage';
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
  audit: SwissAudit,
  case: SwissCase,
  footer: SwissFooter,
  brief: SwissBrief,
  briefThanks: SwissBriefThanks,
  servicePage: SwissServicePage,
  privacyPage: SwissPrivacyPage,
  legalPage: SwissLegalPage,
  cookieBanner: SwissCookieBanner,
  review: KineticReview,
};

export const SwissSection = (props: SectionProps) => renderSection(COMPONENTS, props);
