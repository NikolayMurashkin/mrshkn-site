'use client';

import { createElement, type ComponentType } from 'react';
import type { SectionName, SectionProps } from '../types';
import './fonts';
import { PopFooter } from './Footer';
import { PopHeader } from './Header';
import { PopHero } from './Hero';
import { PopPricing } from './Pricing';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: PopHeader,
  hero: PopHero,
  pricing: PopPricing,
  footer: PopFooter,
};

export const PopSection = ({ section }: SectionProps) => createElement(SECTIONS[section]);
