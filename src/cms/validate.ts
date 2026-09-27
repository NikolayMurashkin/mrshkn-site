import { SLUG_PATTERN } from './consts';

export const validateSlug = (value: unknown) =>
  typeof value === 'string' && SLUG_PATTERN.test(value)
    ? true
    : 'Адрес — латиница в нижнем регистре, цифры и дефисы, например klinika-na-kode';
