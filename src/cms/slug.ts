import type { FieldHook, TextFieldSingleValidation, TypeWithID } from 'payload';
import { SLUG_PATTERN, SLUG_TRANSLIT } from './consts';
import type { SlugSource } from './types';

export const toSlug = (value: string) =>
  [...value.toLowerCase()]
    .map((letter) => SLUG_TRANSLIT[letter] ?? letter)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const slugOf = (value: unknown, siblingData: SlugSource | undefined) =>
  toSlug(typeof value === 'string' && value.trim() ? value : (siblingData?.title ?? ''));

/**
 * Адрес не набирают руками по правилам: пустой берется из заголовка, набранный приводится к латинице
 * в нижнем регистре. Иначе редактор упирается в ошибку «Адрес» на каждой публикации.
 */
export const fillSlug: FieldHook<TypeWithID, string | null | undefined, SlugSource> = ({ value, siblingData }) =>
  slugOf(value, siblingData) || value;

export const validateSlug: TextFieldSingleValidation = (value, { siblingData }) =>
  SLUG_PATTERN.test(slugOf(value, siblingData as SlugSource))
    ? true
    : 'В адресе нужна хотя бы одна буква или цифра — например klinika-na-kode';
