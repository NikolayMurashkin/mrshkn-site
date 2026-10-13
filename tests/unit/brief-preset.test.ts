import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRIEF_EMPTY_ANSWERS } from '@/components/Brief/consts';
import { initialBriefAnswers } from '@/components/Brief/initial-answers';
import { parseBriefPreset } from '@/lib/brief/preset';

const SRC_DIR = resolve(import.meta.dirname, '../../src');

const source = (path: string) => readFileSync(resolve(SRC_DIR, path), 'utf8');

describe('parseBriefPreset — предвыбор квиза из адреса', () => {
  it('тариф и ниша из справочников проходят как есть', () => {
    expect(parseBriefPreset({ plan: 'industry', niche: 'clinic' })).toEqual({ plan: 'industry', niche: 'clinic' });
  });

  it.each(['dental', '', 'CLINIC', ' clinic'])('ниша %j вне справочника — без предвыбора ниши', (niche) => {
    expect(parseBriefPreset({ plan: 'landing', niche })).toEqual({ plan: 'landing', niche: null });
  });

  it.each(['start', 'unknown'])('тариф %j вне справочника — без предвыбора тарифа', (plan) => {
    expect(parseBriefPreset({ plan })).toEqual({ plan: null, niche: null });
  });

  it('повтор параметра в адресе — массив, а не строка: предвыбора нет', () => {
    expect(parseBriefPreset({ plan: ['industry'], niche: ['clinic', 'expert'] })).toEqual({ plan: null, niche: null });
  });

  it('без параметров — без предвыбора', () => {
    expect(parseBriefPreset({})).toEqual({ plan: null, niche: null });
  });
});

describe('initialBriefAnswers — начальные ответы квиза', () => {
  it('с пресетом: направление из cookie, тариф и ниша предвыбраны', () => {
    expect(initialBriefAnswers({ design: 'kinetic', plan: 'industry', niche: 'clinic' })).toEqual({
      ...BRIEF_EMPTY_ANSWERS,
      design: 'kinetic',
      product: 'industry',
      niche: 'clinic',
    });
  });

  it('без пресета квиз начинается как раньше: предвыбрано только направление', () => {
    expect(initialBriefAnswers({ design: 'pop', plan: null, niche: null })).toEqual({
      ...BRIEF_EMPTY_ANSWERS,
      design: 'pop',
    });
  });

  it('страница квиза разбирает адрес через parseBriefPreset, хук квиза берет начальные ответы из initialBriefAnswers', () => {
    expect(source('app/[locale]/brief/page.tsx')).toContain('parseBriefPreset(');
    expect(source('components/Brief/use-brief.ts')).toContain('initialBriefAnswers(');
  });
});
