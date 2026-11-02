import { describe, expect, it } from 'vitest';
import { formatAuditLead, parseAuditLead } from '@/lib/audit/lead';

/**
 * Разбор тела формы «Проверьте свой сайт» и текст заявки для Telegram и почты. Порядок проверок: ловушка `zone`
 * первой (боту отвечают как человеку), затем согласие, затем имя и контакт, затем адрес сайта.
 */

type AuditLeadInput = Parameters<typeof formatAuditLead>[0];

const CONTEXT = { marks: { utm_source: 'ya' }, page: '/ru' };

const VALID = { name: 'Анна', url: 'example.ru', contact: '@anna', consent: true };

const LONG_FIELD = 'А'.repeat(121);

const LEAD: AuditLeadInput = {
  name: 'Анна',
  contact: '@anna',
  siteUrl: 'https://example.ru/',
  marks: { utm_source: 'ya', utm_medium: '' },
  page: '/ru',
};

const parse = (input: unknown) => parseAuditLead(input, CONTEXT);

const reasonOf = (input: unknown) => {
  const result = parse(input);

  return result.ok ? 'ok' : result.reason;
};

describe('разбор заявки на замер', () => {
  it('L1: полное тело — заявка с нормализованным адресом, обрезанными именем и контактом, метками и страницей', () => {
    const result = parse({ ...VALID, name: '  Анна ', contact: ' @anna  ' });

    expect(result).toMatchObject({
      ok: true,
      lead: {
        name: 'Анна',
        contact: '@anna',
        siteUrl: 'https://example.ru/',
        marks: { utm_source: 'ya' },
        page: '/ru',
      },
    });
  });

  it('L2: заполненная ловушка — honeypot раньше проверки согласия', () => {
    expect(reasonOf({ ...VALID, consent: false, zone: 'x' })).toBe('honeypot');
  });

  it.each([
    ['согласие false', { ...VALID, consent: false }],
    ['согласия нет', { name: VALID.name, url: VALID.url, contact: VALID.contact }],
    ["согласие строкой 'true'", { ...VALID, consent: 'true' }],
  ])('L3: %s → consent', (_label, input) => {
    expect(reasonOf(input)).toBe('consent');
  });

  it.each([
    ['пустое имя', { ...VALID, name: '   ' }],
    ['пустой контакт', { ...VALID, contact: '' }],
    ['имя 121 знак', { ...VALID, name: LONG_FIELD }],
    ['контакт 121 знак', { ...VALID, contact: LONG_FIELD }],
  ])('L4: %s → fields', (_label, input) => {
    expect(reasonOf(input)).toBe('fields');
  });

  it('L4: имя и контакт ровно по 120 знаков — заявка принята (отказ только длиннее)', () => {
    const result = parse({ ...VALID, name: 'А'.repeat(120), contact: 'a'.repeat(120) });

    expect(result.ok).toBe(true);
  });

  it.each([
    ['адреса нет', { name: VALID.name, contact: VALID.contact, consent: true }],
    ['адрес пустой', { ...VALID, url: '' }],
    ['адрес ftp', { ...VALID, url: 'ftp://example.ru' }],
  ])('L5: %s → url', (_label, input) => {
    expect(reasonOf(input)).toBe('url');
  });

  it.each([
    ['null', null],
    ['строка', 'name=Анна'],
    ['массив', [VALID]],
  ])('L6: тело — %s → отказ без исключения', (_label, input) => {
    expect(parse(input).ok).toBe(false);
  });
});

describe('текст заявки на замер', () => {
  it('L7: первая строка «Заявка: замер», строки имени, сайта, связи, страницы и непустые метки', () => {
    const lines = formatAuditLead(LEAD).split('\n');

    expect(lines[0]).toBe('Заявка: замер');
    expect(lines).toEqual(
      expect.arrayContaining([
        'Имя: Анна',
        'Сайт: https://example.ru/',
        'Связь: @anna',
        'Страница: /ru',
        'utm_source=ya',
      ]),
    );
    expect(lines.filter((line) => line.startsWith('utm_'))).toEqual(['utm_source=ya']);
  });
});
