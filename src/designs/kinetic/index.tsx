'use client';

import { createElement, type ComponentType } from 'react';
import type { DesignSectionProps, SectionName } from '../types';
import './fonts';
import { KineticFooter } from './Footer';
import { KineticHeader } from './Header';
import { KineticHero } from './Hero';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: KineticHeader,
  hero: KineticHero,
  footer: KineticFooter,
};

export const KineticSection = ({ section }: DesignSectionProps) => createElement(SECTIONS[section]);
