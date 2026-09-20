'use client';

import { createElement, type ComponentType } from 'react';
import type { SectionName, SectionProps } from '../types';
import './fonts';
import { KineticFooter } from './Footer';
import { KineticHeader } from './Header';
import { KineticHero } from './Hero';
import { KineticPricing } from './Pricing';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: KineticHeader,
  hero: KineticHero,
  pricing: KineticPricing,
  footer: KineticFooter,
};

export const KineticSection = ({ section }: SectionProps) => createElement(SECTIONS[section]);
