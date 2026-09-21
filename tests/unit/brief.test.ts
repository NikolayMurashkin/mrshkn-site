import { describe, expect, it } from 'vitest';
import {
  BRIEF_STEP_VALUES,
  COMMENT_MAX_LENGTH,
  CONTACT_MAX_LENGTH,
  HONEYPOT_FIELD,
  MARK_MAX_LENGTH,
  NAME_MAX_LENGTH,
} from '@/lib/brief/consts';
import { cleanMark, formatLead, parseLead } from '@/lib/brief/lead';
import { createRateLimiter } from '@/lib/brief/rate-limit';

const MARKS = { utm_source: 'avito', utm_medium: 'cpc', utm_campaign: 'clinics', utm_content: 'dental-demo' };

const CONTEXT = { marks: MARKS, page: '/ru/brief' };

const INPUT = {
  product: 'miniApp',
  niche: 'clinic',
  design: 'swiss',
  timing: 'twoWeeks',
  budget: 'to250',
  name: 'Иван',
  contact: '@ivan',
  comment: 'Запись к врачу внутри Telegram.',
  consent: true,
  [HONEYPOT_FIELD]: '',
  plan: null,
};

const parsed = (overrides: Record<string, unknown> = {}) => parseLead({ ...INPUT, ...overrides }, CONTEXT);

describe('разбор заявки с квиза', () => {
  it('собирает заявку с источником «site», ответами шагов и метками кампании', () => {
    const result = parsed();

    expect(result).toEqual({
      ok: true,
      lead: {
        source: 'site',
        product: 'miniApp',
        niche: 'clinic',
        design: 'swiss',
        timing: 'twoWeeks',
        budget: 'to250',
        name: 'Иван',
        contact: '@ivan',
        comment: 'Запись к врачу внутри Telegram.',
        plan: null,
        marks: MARKS,
        page: '/ru/brief',
      },
    });
  });

  it('без согласия на обработку данных заявка не собирается', () => {
    expect(parsed({ consent: false })).toEqual({ ok: false, reason: 'consent' });
  });

  it('заполненная ловушка отбивается своей причиной, а не ошибкой полей', () => {
    expect(parsed({ [HONEYPOT_FIELD]: 'ООО «Бот»' })).toEqual({ ok: false, reason: 'honeypot' });
  });

  it.each([
    ['name', NAME_MAX_LENGTH],
    ['contact', CONTACT_MAX_LENGTH],
    ['comment', COMMENT_MAX_LENGTH],
  ])('поле %s режется по своему пределу, а не уезжает в канал целиком', (field, limit) => {
    const result = parsed({ [field]: 'я'.repeat(limit + 500) });

    if (!result.ok) {
      throw new Error('заявка должна была собраться');
    }

    expect(result.lead[field as 'name' | 'contact' | 'comment']).toHaveLength(limit);
  });

  it.each(['name', 'contact'])('без поля %s заявка не собирается', (field) => {
    expect(parsed({ [field]: '   ' })).toEqual({ ok: false, reason: 'fields' });
  });

  it.each(Object.keys(BRIEF_STEP_VALUES))('значение шага %s вне справочника не проходит', (step) => {
    expect(parsed({ [step]: 'придумано-ботом' })).toEqual({ ok: false, reason: 'fields' });
  });

  it('комментарий необязателен', () => {
    expect(parsed({ comment: '' })).toMatchObject({ ok: true });
  });
});

describe('метка кампании приходит из адреса, то есть от кого угодно', () => {
  it('режется по длине: иначе она месяц живет в cookie и переполняет сообщение бота', () => {
    expect(cleanMark('a'.repeat(MARK_MAX_LENGTH + 400))).toHaveLength(MARK_MAX_LENGTH);
  });

  it('теряет управляющие символы, включая перевод строки', () => {
    expect(cleanMark('avito\r\nSet-Cookie: x=1')).toBe('avitoSet-Cookie: x=1');
  });

  it('кириллицу и точки с дефисами оставляет: кампании называют по-русски', () => {
    expect(cleanMark('клиники-калининград.осень')).toBe('клиники-калининград.осень');
  });
});

describe('текст заявки для трех каналов', () => {
  it('несет источник, нишу, стиль и все метки кампании', () => {
    const result = parsed();

    if (!result.ok) {
      throw new Error('заявка должна была собраться');
    }

    const text = formatLead(result.lead);

    expect(text).toContain('source=site');
    expect(text).toContain('niche=clinic');
    expect(text).toContain('design=swiss');

    for (const [mark, value] of Object.entries(MARKS)) {
      expect(text).toContain(`${mark}=${value}`);
    }
  });
});

describe('лимит заявок с одного адреса', () => {
  it('пропускает заявки до предела и отбивает следующую', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });

    expect([limiter.allow('1.1.1.1', 0), limiter.allow('1.1.1.1', 1), limiter.allow('1.1.1.1', 2)]).toEqual([
      true,
      true,
      true,
    ]);
    expect(limiter.allow('1.1.1.1', 3)).toBe(false);
  });

  it('соседний адрес лимитом не задет', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(limiter.allow('1.1.1.1', 0)).toBe(true);
    expect(limiter.allow('2.2.2.2', 0)).toBe(true);
  });

  it('после окна адрес снова проходит', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(limiter.allow('1.1.1.1', 0)).toBe(true);
    expect(limiter.allow('1.1.1.1', 59_999)).toBe(false);
    expect(limiter.allow('1.1.1.1', 60_001)).toBe(true);
  });
});
