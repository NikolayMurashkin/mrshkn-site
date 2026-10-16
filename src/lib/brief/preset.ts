import { BRIEF_PLAN_VALUES, BRIEF_STEP_VALUES } from './consts';
import type { BriefPreset, BriefPresetParams } from './types';

/** Значение из адреса проходит, только если это строка из справочника: повтор параметра дает массив. */
const presetValue = (value: string | string[] | undefined, allowed: readonly string[]) =>
  typeof value === 'string' && allowed.includes(value) ? value : null;

/**
 * Предвыбор квиза из `?plan=` и `?niche=`: чужое значение не ломает квиз, а просто не предвыбирается.
 * Вариант тарифа проходит как есть: квиз выберет его тариф, а сам вариант уйдет в заявку.
 */
export const parseBriefPreset = ({ plan, niche }: BriefPresetParams): BriefPreset => ({
  plan: presetValue(plan, BRIEF_PLAN_VALUES),
  niche: presetValue(niche, BRIEF_STEP_VALUES.niche),
});
