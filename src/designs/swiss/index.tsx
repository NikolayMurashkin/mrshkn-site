'use client';

import { createElement, type ComponentType } from 'react';
import type { SectionName, SectionProps } from '../types';
import './fonts';
import { SwissFooter } from './Footer';
import { SwissHeader } from './Header';
import { SwissHero } from './Hero';
import { SwissPricing } from './Pricing';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: SwissHeader,
  hero: SwissHero,
  pricing: SwissPricing,
  footer: SwissFooter,
};

export const SwissSection = ({ section }: SectionProps) => createElement(SECTIONS[section]);
