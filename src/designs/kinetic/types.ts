import type { ReactNode } from 'react';
import type { BriefChoice } from '@/lib/brief/types';
import type { TeamCardData } from '../types';

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

/** Карточка человека в секции «Команда»: данные — из общей `teamSection`. */
export type KineticTeamCardProps = {
  card: TeamCardData;
};
