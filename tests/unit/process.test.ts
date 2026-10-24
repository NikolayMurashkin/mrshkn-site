import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROCESS_SCALE, PROCESS_STEPS, PROMISES } from '@/content/process';
import { TERMINAL_LOG_LINES } from '@/designs/terminal/consts';
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
  'scale',
];

/** Шкала «дни и паузы»: выбор стиля до дня 1, после каждого дня — пауза на ответ заказчика; оплаты — 30 / 40 / 30. */
const SCALE = [
  { kind: 'style', payment: 'prepayment' },
  { kind: 'day', day: 1 },
  { kind: 'pause', pause: 'round1' },
  { kind: 'day', day: 2 },
  { kind: 'pause', pause: 'round2' },
  { kind: 'day', day: 3 },
  { kind: 'pause', pause: 'round3', payment: 'second' },
  { kind: 'day', day: 4 },
  { kind: 'pause', pause: 'acceptance', payment: 'final' },
];

type ScaleSegment = { kind: string; day?: number; pause?: string; payment?: string };

const valueAt = (root: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object') {
      return (node as Record<string, unknown>)[key];
    }

    return undefined;
  }, root);

/** Ключи подписей отрезка: сам отрезок и, если на нем платеж, подпись оплаты. */
const segmentKeys = (segment: ScaleSegment) => {
  const label =
    segment.kind === 'style'
      ? 'process.scale.style'
      : segment.kind === 'day'
        ? 'process.scale.day'
        : `process.scale.pauses.${segment.pause}`;

  return segment.payment === undefined ? [label] : [label, `process.scale.payments.${segment.payment}`];
};

describe('четыре дня и обещания', () => {
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

  it('дни таймлайна — 1, 2, 3 и 4: график лендинга', () => {
    expect(PROCESS_STEPS.map((step) => step.day)).toEqual([1, 2, 3, 4]);
  });

  it('шкала «дни и паузы»: выбор стиля, четыре дня с паузами после каждого, оплаты на стиле, раунде 3 и приемке', () => {
    expect(PROCESS_SCALE).toEqual(SCALE);
  });

  it('дни шкалы — те же, что у шагов таймлайна', () => {
    const scale = PROCESS_SCALE as readonly ScaleSegment[];

    expect(scale.filter((segment) => segment.kind === 'day').map((segment) => segment.day)).toEqual(
      PROCESS_STEPS.map((step) => step.day),
    );
  });

  it.each([...LOCALES])('%s: у каждого отрезка шкалы и у легенды есть подпись', (locale) => {
    const keys = [
      ...new Set([
        ...(PROCESS_SCALE as readonly ScaleSegment[]).flatMap(segmentKeys),
        'process.scale.legend.style',
        'process.scale.legend.work',
        'process.scale.legend.pause',
      ]),
    ];
    const texts = messages(locale);

    expect(keys.map((key) => [key, valueAt(texts, key)])).toEqual(
      keys.map((key) => [key, expect.stringMatching(/\S/)]),
    );
    expect(valueAt(texts, 'process.scale.day')).toContain('{day}');
  });

  it('лог Terminal: бриф и предоплата — до дня 1, работа — дни 01–04, гарантия без дня', () => {
    expect(Object.fromEntries(TERMINAL_LOG_LINES.map((line) => [line.key, line.day]))).toEqual({
      brief: null,
      prepayment: null,
      concept: '01',
      staging: '02',
      lighthouse: '03',
      handover: '04',
      warranty: null,
    });
  });
});
