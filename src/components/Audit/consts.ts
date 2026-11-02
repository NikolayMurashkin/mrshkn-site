import { CONTACT_MAX_LENGTH, NAME_MAX_LENGTH } from '@/lib/brief/consts';
import { SITE_URL_MAX_LENGTH } from '@/lib/audit/consts';
import type { AuditFieldName } from './types';

export const AUDIT_FIELD_NAMES = ['name', 'url', 'contact'] as const;

/** Поля с подсказкой под полем: где взять адрес и как ответим на телефон. */
export const AUDIT_HINT_FIELDS: readonly AuditFieldName[] = ['url', 'contact'];

export const AUDIT_EMPTY_VALUES: Record<AuditFieldName, string> = { name: '', url: '', contact: '' };

export const AUDIT_MAX_LENGTH: Record<AuditFieldName, number> = {
  name: NAME_MAX_LENGTH,
  url: SITE_URL_MAX_LENGTH,
  contact: CONTACT_MAX_LENGTH,
};

/** Автозаполнение: имя и адрес сайта браузер знает, контакт — любой из трех видов, подсказка помешала бы. */
export const AUDIT_AUTOCOMPLETE: Record<AuditFieldName, string> = { name: 'name', url: 'url', contact: 'off' };
