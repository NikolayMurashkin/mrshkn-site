import { describe, expect, it } from 'vitest';
import ru from '../../messages/ru.json';

/** Нижняя и верхняя граница длины шага в знаках: неразрывные пробелы — тоже знаки. */
const MIN_LENGTH = 250;

const MAX_LENGTH = 350;

/** Шаги главной по порядку показа. */
const HOME_STEPS = ['brief', 'concept', 'staging', 'launch'];

/** Услуги со своими шагами и число шагов у каждой; поддержка в список не входит — ее шаги не меняются. */
const SERVICE_STEP_COUNTS: [string, number][] = [
  ['landing', 4],
  ['industry', 4],
  ['business', 4],
  ['miniApp', 4],
  ['store', 4],
  ['mvp', 4],
  ['threeD', 5],
];

/** Шаги поддержки 1 и 2 — прежние тексты, шаг 0 — утвержденная формула аварии. */
const SUPPORT_STEP_TEXTS: string[] = [
  'Следим, чтобы сайт открывался. Регулярно делаем запасные копии (бэкапы), чтобы при сбое сайт можно было восстановить. Восстановление сайта после сбоя, в\u00a0том числе из\u00a0запасной копии, входит в\u00a0месячную плату. Если сайт перестал работать, начинаем чинить быстро. Написали в\u00a0будни с\u00a010 до\u00a019 по\u00a0Москве (с\u00a09 до\u00a018 по\u00a0Калининграду)\u00a0— в\u00a0течение 2\u00a0часов. Написали ночью, в\u00a0выходные или в\u00a0праздник\u00a0— в\u00a0первые 2\u00a0часа ближайшего рабочего дня, то есть до\u00a012 по\u00a0Москве.',
  'Обновляем программы, на\u00a0которых работает сайт, чтобы он не\u00a0отставал от\u00a0новых версий.',
  'Пишете нам, что поменять. На\u00a0тарифах с\u00a0часами делаем это в\u00a0счет часов, которые входят в\u00a0оплату: 3, 10 или 25\u00a0часов в\u00a0месяц. На\u00a0тарифе за\u00a0{hostingBackups} часов нет\u00a0— работу считаем отдельно, 3\u00a0000\u00a0₽ за\u00a0час. Ошибки по\u00a0нашей вине в\u00a0год гарантии чиним бесплатно, часы на\u00a0них не\u00a0тратим.',
];

const valueAt = (root: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object') {
      return (node as Record<string, unknown>)[key];
    }

    return undefined;
  }, root);

const STEP_KEYS = [
  ...HOME_STEPS.map((id) => `process.steps.${id}.text`),
  ...SERVICE_STEP_COUNTS.flatMap(([id, count]) =>
    Array.from({ length: count }, (_, index) => `services.${id}.process.${index}.text`),
  ),
];

const lengthOf = (path: string) => {
  const value = valueAt(ru, path);

  return typeof value === 'string' ? value.length : null;
};

describe('длина текста шага на главной и страницах услуг — от 250 до 350 знаков', () => {
  it.each(STEP_KEYS.map((path) => [path, lengthOf(path) ?? 'нет текста'] as const))('%s: %s знаков', (path) => {
    const length = lengthOf(path);

    expect(length, `${path}: текст шага`).not.toBeNull();
    expect(length).toBeGreaterThanOrEqual(MIN_LENGTH);
    expect(length).toBeLessThanOrEqual(MAX_LENGTH);
  });

  it('поддержка: длина не проверяется, шаг 0 — утвержденный текст, шаги 1 и 2 — прежние', () => {
    expect(ru.services.support.process.map((step) => step.text)).toEqual(SUPPORT_STEP_TEXTS);
  });
});
