'use client';

import { renderSection } from '../render';
import type { DesignComponents, SectionProps } from '../types';
import './fonts';
import { KineticAudit } from './Audit';
import { KineticCase } from './Case';
import { KineticCookieBanner } from './CookieBanner';
import { KineticFooter } from './Footer';
import { KineticHeader } from './Header';
import { KineticHero } from './Hero';
import { KineticBrief } from './KineticBrief';
import { KineticBriefThanks } from './KineticBriefThanks';
import { KineticReview } from './KineticReview';
import { KineticPricing } from './Pricing';
import { KineticLegalPage } from './LegalPage';
import { KineticPrivacyPage } from './PrivacyPage';
import { KineticProcess } from './Process';
import { KineticServicePage } from './ServicePage';
import { KineticWorks } from './Works';

const COMPONENTS: DesignComponents = {
  header: KineticHeader,
  hero: KineticHero,
  pricing: KineticPricing,
  works: KineticWorks,
  process: KineticProcess,
  audit: KineticAudit,
  case: KineticCase,
  footer: KineticFooter,
  brief: KineticBrief,
  briefThanks: KineticBriefThanks,
  servicePage: KineticServicePage,
  privacyPage: KineticPrivacyPage,
  legalPage: KineticLegalPage,
  cookieBanner: KineticCookieBanner,
  review: KineticReview,
};

export const KineticSection = (props: SectionProps) => renderSection(COMPONENTS, props);
