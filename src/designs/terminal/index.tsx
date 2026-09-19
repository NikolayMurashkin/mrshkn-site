'use client';

import { createElement, type ComponentType } from 'react';
import type { DesignSectionProps, SectionName } from '../types';
import './fonts';
import { TerminalFooter } from './Footer';
import { TerminalHeader } from './Header';
import { TerminalHero } from './Hero';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: TerminalHeader,
  hero: TerminalHero,
  footer: TerminalFooter,
};

export const TerminalSection = ({ section }: DesignSectionProps) => createElement(SECTIONS[section]);
