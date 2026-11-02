/**
 * Разделы политики в порядке документа; номера им дает CSS-счетчик верстки, текст — `privacy.sections.<id>`.
 * Последний — текст согласия из формы заявки: на него ведет адрес `#consent` из самого согласия.
 */
export const PRIVACY_SECTIONS = [
  'operator',
  'data',
  'storage',
  'transfer',
  'cookies',
  'rights',
  'changes',
  'consent',
] as const;

/** Раздел, в конце которого стоит кнопка «Изменить выбор». */
export const PRIVACY_CHOICE_SECTION = 'cookies' satisfies (typeof PRIVACY_SECTIONS)[number];

/** Префикс якорей разделов: оглавление ведет на `#privacy-<id>`. */
export const PRIVACY_ANCHOR_PREFIX = 'privacy-';

/** Якоря без префикса: адрес согласия опубликован в самом тексте согласия (`/docs/privacy#consent`). */
export const PRIVACY_PLAIN_ANCHORS: readonly (typeof PRIVACY_SECTIONS)[number][] = ['consent'];
