'use client';

import { createElement, type ComponentType } from 'react';
import type { SectionName, SectionProps } from '../types';
import './fonts';
import { TerminalFooter } from './Footer';
import { TerminalHeader } from './Header';
import { TerminalHero } from './Hero';
import { TerminalPricing } from './Pricing';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: TerminalHeader,
  hero: TerminalHero,
  pricing: TerminalPricing,
  footer: TerminalFooter,
};

export const TerminalSection = ({ section }: SectionProps) => createElement(SECTIONS[section]);
