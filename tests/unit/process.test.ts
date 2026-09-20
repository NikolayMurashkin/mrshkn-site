import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import { LOCALES } from '@/i18n/consts';

const messages = (locale: string) => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'));

const processSection = (locale: string, section: string) => messages(locale).process?.[section] ?? {};

const TOP_LEVEL_KEYS = [
  'heading',
  'sectionMark',
  'promisesHeading',
  'contractNote',
  'dayLabel',
  'stepLabel',
  'steps',
  'promises',
];

describe('две недели и обещания', () => {
  it.each([...LOCALES])('%s: в секции есть все верхние ключи', (locale) => {
    expect(Object.keys(messages(locale).process ?? {})).toEqual(TOP_LEVEL_KEYS);
  });

  it.each([...LOCALES])('%s: у каждого шага таймлайна есть заголовок и описание', (locale) => {
    const steps = processSection(locale, 'steps');

    expect(Object.keys(steps)).toEqual(PROCESS_STEPS.map((step) => step.id));
    expect(PROCESS_STEPS.map((step) => steps[step.id])).toEqual(
      PROCESS_STEPS.map(() => ({ title: expect.any(String), text: expect.any(String), ordinal: expect.any(String) })),
    );
  });

  it.each([...LOCALES])('%s: четыре обещания D4 названы и расшифрованы', (locale) => {
    const promises = processSection(locale, 'promises');

    expect(Object.keys(promises)).toEqual([...PROMISES]);
    expect(PROMISES.map((id) => promises[id])).toEqual(
      PROMISES.map(() => ({ kicker: expect.any(String), value: expect.any(String), detail: expect.any(String) })),
    );
  });

  it('дни таймлайна — 1, 3, 10 и 14 (D4)', () => {
    expect(PROCESS_STEPS.map((step) => step.day)).toEqual([1, 3, 10, 14]);
  });
});
