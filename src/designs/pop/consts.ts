import { PROCESS_STEPS } from '@/content/process';
import type { PopTone } from './types';

export const POP_STICKERS = ['lighthouse', 'deadline', 'warranty'] as const;

export const POP_HEADER_OFFSET = 108;

export const POP_STUDIO_EMAIL = 'hello@mrshkn.com';

export const POP_BOARD_DAYS = Array.from({ length: 14 }, (_, index) => index + 1);

export const POP_STEP_TONES: readonly PopTone[] = [1, 2, 3, 4];

export const POP_KEY_DAY_TONES: ReadonlyMap<number, PopTone> = new Map(
  PROCESS_STEPS.map((step, index) => [step.day, POP_STEP_TONES[index % POP_STEP_TONES.length]]),
);

export const POP_STEP_TEXT_TAGS = { h3: 'p', span: 'span' } as const;
