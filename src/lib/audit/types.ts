import type { UtmMarks } from '@/lib/brief/types';
import type { LEAD_KINDS } from './consts';

/** Заявка на бесплатный замер: кто, какой сайт проверить и куда прислать ответ. */
export type AuditLead = {
  name: string;
  contact: string;
  /** Адрес после `normalizeSiteUrl`: только `http(s)`, хост в нижнем регистре. */
  siteUrl: string;
  marks: UtmMarks;
  page: string;
};

/** Почему заявка на замер не собралась: ловушка отвечает 200, остальные — 400. */
export type AuditRejection = 'consent' | 'honeypot' | 'fields' | 'url';

export type AuditLeadResult = { ok: true; lead: AuditLead } | { ok: false; reason: AuditRejection };

/** Что известно о заявке помимо полей формы: метки кампании и адрес страницы. */
export type AuditLeadContext = { marks: UtmMarks; page: string };

/** Вид заявки в CRM: квиз или бесплатный замер. */
export type LeadKind = (typeof LEAD_KINDS)[number];
