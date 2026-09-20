'use client';

import { createElement, type ComponentType } from 'react';
import type { SectionName, SectionProps } from '../types';
import './fonts';
import { TerminalFooter } from './Footer';
import { TerminalHeader } from './Header';
import { TerminalHero } from './Hero';
import { TerminalPricing } from './Pricing';
import { TerminalProcess } from './Process';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: TerminalHeader,
  hero: TerminalHero,
  pricing: TerminalPricing,
  process: TerminalProcess,
  footer: TerminalFooter,
};

export const TerminalSection = ({ section }: SectionProps) => createElement(SECTIONS[section]);
