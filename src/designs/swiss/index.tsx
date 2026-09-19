'use client';

import { createElement, type ComponentType } from 'react';
import type { SectionName, SectionProps } from '../types';
import './fonts';
import { SwissFooter } from './Footer';
import { SwissHeader } from './Header';
import { SwissHero } from './Hero';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: SwissHeader,
  hero: SwissHero,
  footer: SwissFooter,
};

export const SwissSection = ({ section }: SectionProps) => createElement(SECTIONS[section]);
