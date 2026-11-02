import config from '@payload-config';
import { getPayload } from 'payload';
import { DEFAULT_LOCALE, LOCALES } from '../i18n/consts';
import type { AuditLead } from '../lib/audit/types';
import { LEAD_SOURCE, UTM_PARAMS } from '../lib/brief/consts';
import type { Lead, UtmMarks } from '../lib/brief/types';

/** Язык заявки — первый сегмент адреса страницы формы; адрес без языка — язык сайта по умолчанию. */
const localeOf = (page: string) => LOCALES.find((locale) => locale === page.split('/')[1]) ?? DEFAULT_LOCALE;

/** Пустые метки не пишутся — заявка без рекламы остается без меток. */
const utmOf = (marks: UtmMarks): UtmMarks =>
  Object.fromEntries(UTM_PARAMS.filter((mark) => marks[mark]).map((mark) => [mark, marks[mark]]));

/**
 * Заявка в CRM студии. Пишет обработчик формы мимо прав коллекции: посетитель не входит в админку, а создать
 * заявку через REST без входа нельзя.
 */
export const saveLead = async ({ marks, ...lead }: Lead) => {
  const payload = await getPayload({ config });
  const record = await payload.create({
    collection: 'leads',
    data: { ...lead, ...utmOf(marks), kind: 'brief', locale: localeOf(lead.page), stage: 'new' },
    depth: 0,
    overrideAccess: true,
  });

  return record.id;
};

/** Заявка на бесплатный замер: вид «замер», адрес сайта, ответов квиза нет. */
export const saveAuditLead = async ({ marks, ...lead }: AuditLead) => {
  const payload = await getPayload({ config });
  const record = await payload.create({
    collection: 'leads',
    data: {
      ...lead,
      ...utmOf(marks),
      kind: 'audit',
      source: LEAD_SOURCE,
      locale: localeOf(lead.page),
      stage: 'new',
    },
    depth: 0,
    overrideAccess: true,
  });

  return record.id;
};
