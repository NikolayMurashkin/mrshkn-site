import config from '@payload-config';
import { getPayload } from 'payload';
import { DEFAULT_LOCALE, LOCALES } from '../i18n/consts';
import { UTM_PARAMS } from '../lib/brief/consts';
import type { Lead, UtmMarks } from '../lib/brief/types';

/** Язык заявки — первый сегмент адреса страницы квиза; адрес без языка — язык сайта по умолчанию. */
const localeOf = (page: string) => LOCALES.find((locale) => locale === page.split('/')[1]) ?? DEFAULT_LOCALE;

/**
 * Заявка квиза в CRM студии. Пишет обработчик квиза мимо прав коллекции: посетитель не входит в админку, а создать
 * заявку через REST без входа нельзя. Пустые метки не пишутся — заявка без рекламы остается без меток.
 */
export const saveLead = async ({ marks, ...lead }: Lead) => {
  const payload = await getPayload({ config });
  const utm: UtmMarks = Object.fromEntries(UTM_PARAMS.filter((mark) => marks[mark]).map((mark) => [mark, marks[mark]]));
  const record = await payload.create({
    collection: 'leads',
    data: { ...lead, ...utm, locale: localeOf(lead.page), stage: 'new' },
    depth: 0,
    overrideAccess: true,
  });

  return record.id;
};
