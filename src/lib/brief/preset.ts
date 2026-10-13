import { BRIEF_STEP_VALUES } from './consts';
import type { BriefPreset, BriefPresetParams } from './types';

/** Значение из адреса проходит, только если это строка из справочника: повтор параметра дает массив. */
const presetValue = (value: string | string[] | undefined, allowed: readonly string[]) =>
  typeof value === 'string' && allowed.includes(value) ? value : null;

/** Предвыбор квиза из `?plan=` и `?niche=`: чужое значение не ломает квиз, а просто не предвыбирается. */
export const parseBriefPreset = ({ plan, niche }: BriefPresetParams): BriefPreset => ({
  plan: presetValue(plan, BRIEF_STEP_VALUES.product),
  niche: presetValue(niche, BRIEF_STEP_VALUES.niche),
});
