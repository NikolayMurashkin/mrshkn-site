'use client';

import dynamic from 'next/dynamic';
import { createElement, type ComponentType } from 'react';
import type { DesignName, DesignSectionProps, SectionProps } from './types';

const SECTIONS: Record<DesignName, ComponentType<SectionProps>> = {
  kinetic: dynamic(() => import('./kinetic').then((module) => module.KineticSection)),
  terminal: dynamic(() => import('./terminal').then((module) => module.TerminalSection)),
  pop: dynamic(() => import('./pop').then((module) => module.PopSection)),
  swiss: dynamic(() => import('./swiss').then((module) => module.SwissSection)),
  editorial: dynamic(() => import('./editorial').then((module) => module.EditorialSection)),
};

const LOADERS: Record<DesignName, () => Promise<unknown>> = {
  kinetic: () => import('./kinetic'),
  terminal: () => import('./terminal'),
  pop: () => import('./pop'),
  swiss: () => import('./swiss'),
  editorial: () => import('./editorial'),
};

export const DesignSection = ({ design, section }: DesignSectionProps) => createElement(SECTIONS[design], { section });

export const preloadDesign = (design: DesignName) => LOADERS[design]();
