/** Разделы политики в порядке показа; номера им дает CSS-счетчик верстки, текст — `privacy.sections.<id>`. */
export const PRIVACY_SECTIONS = [
  'operator',
  'data',
  'purposes',
  'basis',
  'transfer',
  'storage',
  'cookies',
  'rights',
  'changes',
] as const;

/** Раздел, в конце которого стоит кнопка «Изменить выбор». */
export const PRIVACY_CHOICE_SECTION = 'cookies' satisfies (typeof PRIVACY_SECTIONS)[number];

/** Префикс якорей разделов: оглавление ведет на `#privacy-<id>`. */
export const PRIVACY_ANCHOR_PREFIX = 'privacy-';
