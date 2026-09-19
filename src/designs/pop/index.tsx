'use client';

import { createElement, type ComponentType } from 'react';
import type { DesignSectionProps, SectionName } from '../types';
import './fonts';
import { PopFooter } from './Footer';
import { PopHeader } from './Header';
import { PopHero } from './Hero';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: PopHeader,
  hero: PopHero,
  footer: PopFooter,
};

export const PopSection = ({ section }: DesignSectionProps) => createElement(SECTIONS[section]);
