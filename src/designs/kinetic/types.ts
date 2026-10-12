import type { ReactNode } from 'react';
import type { BriefChoice } from '@/lib/brief/types';

export type ButtonClassOptions = {
  primary?: boolean;
  size?: 'small' | 'large';
  onInk?: boolean;
};

export type SectionHeadProps = {
  id: string;
  kicker: string;
  title: ReactNode;
  note?: string;
};

export type ArrowIconProps = {
  size?: number;
  strokeWidth?: number;
};

export type KineticChoicesProps = {
  field: BriefChoice;
  values: readonly string[];
  selected: string;
  labelOf: (value: string) => string;
  onPick: (field: BriefChoice, value: string) => void;
};

export type KineticDesignChoiceProps = {
  selected: string;
  onPick: (field: BriefChoice, value: string) => void;
  labelOf: (value: string) => string;
};
