import type { ReactNode } from 'react';
import type { ReviewFieldName, UseReview } from '@/components/Review/types';
import type { BriefChoice } from '@/lib/brief/types';
import type { ReviewDocumentText } from '@/lib/review/types';
import type { ServiceThreeD, ServiceTiers } from '@/components/ServicePage/types';
import type { ProcessCardsBlock } from '@/components/types';

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
  level?: 'h1' | 'h2';
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
  disabled: boolean;
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

/** Блоки страницы «3D-интерактив»: постер и ролик, варианты, условия, что нужно от клиента. */
export type KineticServiceThreeDProps = {
  data: ServiceThreeD;
  tiers: ServiceTiers | null;
};

export type KineticServiceTiersProps = {
  data: ServiceTiers;
};

export type KineticProcessCardsProps = {
  /** «Перед стартом» или «Гарантия после запуска»: заголовок блока `h3`, заголовки карточек `h4`. */
  block: ProcessCardsBlock;
  /** Колонка страницы услуги рядом с карточкой тарифа: заголовок блока мельче, чем на главной. */
  narrow?: boolean;
};
