import { CONTACT_MAX_LENGTH, HONEYPOT_FIELD, NAME_MAX_LENGTH, UTM_PARAMS } from '@/lib/brief/consts';
import type { AuditLead, AuditLeadContext, AuditLeadResult } from './types';
import { normalizeSiteUrl } from './url';

const textOf = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const fitsField = (value: string, max: number) => value.length > 0 && value.length <= max;

/**
 * Тело формы замера → заявка. Ловушка первой: боту отвечают как человеку, до остальных проверок. Длинное имя
 * или контакт — отказ, а не обрезка: обрезанный контакт молча станет чужим.
 */
export const parseAuditLead = (input: unknown, context: AuditLeadContext): AuditLeadResult => {
  if (!isRecord(input)) {
    return { ok: false, reason: 'fields' };
  }

  if (textOf(input[HONEYPOT_FIELD])) {
    return { ok: false, reason: 'honeypot' };
  }

  if (input.consent !== true) {
    return { ok: false, reason: 'consent' };
  }

  const name = textOf(input.name);
  const contact = textOf(input.contact);

  if (!fitsField(name, NAME_MAX_LENGTH) || !fitsField(contact, CONTACT_MAX_LENGTH)) {
    return { ok: false, reason: 'fields' };
  }

  const siteUrl = typeof input.url === 'string' ? normalizeSiteUrl(input.url) : null;

  if (!siteUrl) {
    return { ok: false, reason: 'url' };
  }

  return { ok: true, lead: { name, contact, siteUrl, marks: context.marks, page: context.page } };
};

/** Текст заявки на замер для бота и письма: вид заявки первой строкой, ниже — кто, какой сайт, куда ответить. */
export const formatAuditLead = (lead: AuditLead): string => {
  const marks = UTM_PARAMS.filter((mark) => lead.marks[mark]).map((mark) => `${mark}=${lead.marks[mark]}`);

  return [
    'Заявка: замер',
    '',
    `Имя: ${lead.name}`,
    `Сайт: ${lead.siteUrl}`,
    `Связь: ${lead.contact}`,
    `Страница: ${lead.page}`,
    ...(marks.length > 0 ? ['', ...marks] : []),
  ].join('\n');
};
