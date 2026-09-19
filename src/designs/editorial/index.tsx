'use client';

import { createElement, type ComponentType } from 'react';
import type { SectionName, SectionProps } from '../types';
import './fonts';
import { EditorialFooter } from './Footer';
import { EditorialHeader } from './Header';
import { EditorialHero } from './Hero';

const SECTIONS: Record<SectionName, ComponentType> = {
  header: EditorialHeader,
  hero: EditorialHero,
  footer: EditorialFooter,
};

export const EditorialSection = ({ section }: SectionProps) => createElement(SECTIONS[section]);
