import type { TextFieldSingleValidation, UploadFieldSingleValidation } from 'payload';
import { text, upload } from 'payload/shared';

type PublicationCheck = { data?: Partial<{ _status: unknown }>; siblingData?: unknown; name?: string };

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * Значение поля для проверки: публикация из админки или `update` без этого поля в данных приносит `undefined` →
 * берется сохраненное значение документа (`siblingData` у Payload уже слит с документом).
 */
const currentValue = (value: unknown, { siblingData, name }: PublicationCheck) =>
  value === undefined && name && typeof siblingData === 'object' && siblingData !== null
    ? (siblingData as Record<string, unknown>)[name]
    : value;

/** Опубликованный документ без значения поля — ошибка у поля; черновик сохраняется без проверки. */
const missingOnPublish = (value: unknown, check: PublicationCheck) =>
  check.data?._status === 'published' && isEmpty(currentValue(value, check));

/** Текстовое поле, без которого документ не публикуется; остальное проверяет стандартная проверка Payload. */
export const textRequiredOnPublish =
  (message: string): TextFieldSingleValidation =>
  (value, options) =>
    missingOnPublish(value, options) ? message : text(value, options);

/** Картинка, без которой документ не публикуется; остальное проверяет стандартная проверка Payload. */
export const uploadRequiredOnPublish =
  (message: string): UploadFieldSingleValidation =>
  (value, options) =>
    missingOnPublish(value, options) ? message : upload(value, options);
