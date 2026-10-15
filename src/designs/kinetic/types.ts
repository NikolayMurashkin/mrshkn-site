import type { ReactNode } from 'react';
import type { ReviewFieldName, UseReview } from '@/components/Review/types';
import type { BriefChoice } from '@/lib/brief/types';
import type { ReviewDocumentText } from '@/lib/review/types';

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

export type KineticReviewFieldProps = {
  name: ReviewFieldName;
  label: string;
  review: UseReview;
  hint?: string;
  multiline?: boolean;
  type?: 'text' | 'url';
  autoComplete?: string;
};

export type KineticReviewDocumentProps = {
  id: 'consent' | 'license';
  text: ReviewDocumentText;
  edition: string;
  more: string;
  checked: boolean;
  onToggle: UseReview['toggle'];
  children?: ReactNode;
};

export type KineticReviewNoticeProps = {
  view: 'received' | 'invalid';
};
