import {
  BRIEF_STEP_VALUES,
  COMMENT_MAX_LENGTH,
  CONTACT_MAX_LENGTH,
  HONEYPOT_FIELD,
  LEAD_SOURCE,
  MARK_MAX_LENGTH,
  NAME_MAX_LENGTH,
  UTM_PARAMS,
} from './consts';
import type { BriefChoice, Lead, LeadContext, LeadParseResult, UtmMarks } from './types';

const CHOICES: BriefChoice[] = ['product', 'niche', 'design', 'timing', 'budget'];

const textOf = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const choiceOf = (field: BriefChoice, value: unknown) => {
  const candidate = textOf(value);

  return BRIEF_STEP_VALUES[field].includes(candidate) ? candidate : null;
};

export const parseLead = (input: unknown, context: LeadContext): LeadParseResult => {
  const data = (input ?? {}) as Record<string, unknown>;

  if (textOf(data[HONEYPOT_FIELD])) {
    return { ok: false, reason: 'honeypot' };
  }

  if (data.consent !== true) {
    return { ok: false, reason: 'consent' };
  }

  const choices = CHOICES.map((field) => [field, choiceOf(field, data[field])] as const);
  const name = textOf(data.name).slice(0, NAME_MAX_LENGTH);
  const contact = textOf(data.contact).slice(0, CONTACT_MAX_LENGTH);

  if (!name || !contact || choices.some(([, value]) => value === null)) {
    return { ok: false, reason: 'fields' };
  }

  const answers = Object.fromEntries(choices) as Record<BriefChoice, string>;

  return {
    ok: true,
    lead: {
      source: LEAD_SOURCE,
      ...answers,
      name,
      contact,
      comment: textOf(data.comment).slice(0, COMMENT_MAX_LENGTH),
      plan: choiceOf('product', data.plan),
      marks: context.marks,
      page: context.page,
    },
  };
};

/**
 * Метка приходит из адреса, то есть от кого угодно. Управляющие знаки убираются, длина режется:
 * иначе метка на несколько тысяч знаков живет в cookie месяц и переполняет сообщение бота.
 * Алфавит не сужается до латиницы — кампании называют и кириллицей.
 */
export const cleanMark = (value: string) =>
  Array.from(value)
    .filter((char) => char >= ' ' && char !== '\u007f')
    .join('')
    .slice(0, MARK_MAX_LENGTH);

export const parseMarks = (value: string | undefined): UtmMarks => {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    return Object.fromEntries(
      UTM_PARAMS.filter((mark) => typeof parsed[mark] === 'string').map((mark) => [
        mark,
        cleanMark(parsed[mark] as string),
      ]),
    );
  } catch {
    return {};
  }
};

/** Один текст на три канала: человеку — верхняя часть, поиску по заявкам и отчетам — нижняя. */
export const formatLead = (lead: Lead) => {
  const fields = [
    `source=${lead.source}`,
    `product=${lead.product}`,
    `niche=${lead.niche}`,
    `design=${lead.design}`,
    `timing=${lead.timing}`,
    `budget=${lead.budget}`,
    ...(lead.plan ? [`plan=${lead.plan}`] : []),
    ...UTM_PARAMS.filter((mark) => lead.marks[mark]).map((mark) => `${mark}=${lead.marks[mark]}`),
    `page=${lead.page}`,
  ];

  return [
    'Заявка с сайта MRSHKN',
    '',
    `Имя: ${lead.name}`,
    `Связь: ${lead.contact}`,
    ...(lead.comment ? [`Комментарий: ${lead.comment}`] : []),
    '',
    ...fields,
  ].join('\n');
};
