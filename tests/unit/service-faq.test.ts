import { afterEach, describe, expect, it, vi } from 'vitest';
import { fillServiceText, SERVICES, serviceFaqJsonLd } from '@/content/services';
import type { FaqItem, ServiceMessages } from '@/content/types';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

const NBSP = String.fromCodePoint(0x00a0);

const MESSAGES: Record<string, ServiceMessages> = { ru: ru as ServiceMessages, en: en as ServiceMessages };

const ROWS = SERVICES.flatMap((service) => ['ru', 'en'].map((locale) => [locale, service.id] as const));

/** Срок тарифа в ответах FAQ: собирается из дней тарифа, а не пишется в переводе. */
const TERM_ROWS = [
  ['ru', 'landing', `4${NBSP}дня`],
  ['en', 'landing', '4 days'],
  ['ru', 'industry', `7${NBSP}дней`],
  ['en', 'industry', '7 days'],
  ['ru', 'business', `14${NBSP}дней`],
  ['en', 'business', '14 days'],
] as const;

/** Цены уровней поддержки в ответе о составе поддержки: «Хостинг и бэкапы» и уровень с часами правок. */
const SUPPORT_PRICES: Record<string, string[]> = {
  ru: [`7${NBSP}000${NBSP}₽`, `15${NBSP}000${NBSP}₽`],
  en: ['$140', '$250'],
};

type ServiceTexts = { faq?: { answer?: string }[]; process?: { text?: string }[] };

/** Ответы FAQ и тексты шагов всех услуг из перевода, с путем ключа. */
const serviceTextsOf = (messages: unknown) =>
  Object.entries((messages as { services?: Record<string, ServiceTexts> }).services ?? {}).flatMap(([id, service]) => [
    ...(service.faq ?? []).map((item, index) => [`services.${id}.faq.${index}.answer`, item.answer ?? ''] as const),
    ...(service.process ?? []).map((step, index) => [`services.${id}.process.${index}.text`, step.text ?? ''] as const),
  ]);

const faqOf = (locale: string, serviceId: string): FaqItem[] | undefined => MESSAGES[locale].services?.[serviceId]?.faq;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ответ из перевода как шаблон: текст вокруг подстановок совпадает дословно, на месте `{…}` — подставленное значение. */
const templateOf = (answer: string) =>
  new RegExp(
    `^${answer
      .split(/\{[^}]+\}/)
      .map(escapeRegExp)
      .join('[^{}]+')}$`,
  );

/** Срок целиком: «4 дня» не должно найтись внутри «14 дней». */
const hasTerm = (answer: string, term: string) => new RegExp(`(?<!\\d)${escapeRegExp(term)}`).test(answer);

const answersOf = (locale: string, serviceId: string) =>
  serviceFaqJsonLd(MESSAGES[locale], serviceId, locale)?.mainEntity.map((entry) => entry.acceptedAnswer.text) ?? [];

describe('FAQPage услуги из переводов', () => {
  it.each(ROWS)('%s, %s: собирается FAQPage со schema.org', (locale, serviceId) => {
    const result = serviceFaqJsonLd(MESSAGES[locale], serviceId, locale);

    expect(result).not.toBeNull();
    expect(result?.['@context']).toBe('https://schema.org');
    expect(result?.['@type']).toBe('FAQPage');
  });

  it.each(ROWS)('%s, %s: вопросы и ответы — из переводов этой услуги, по порядку', (locale, serviceId) => {
    const faq = faqOf(locale, serviceId) ?? [];
    const result = serviceFaqJsonLd(MESSAGES[locale], serviceId, locale);

    expect(faq.length).toBeGreaterThan(0);
    expect(result?.mainEntity.map((entry) => entry.name)).toEqual(faq.map((item) => item.question));
    expect(result?.mainEntity).toEqual(
      faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: expect.stringMatching(templateOf(item.answer)) },
      })),
    );
  });

  it.each(ROWS)('%s, %s: в переводах не меньше четырех непустых вопросов с ответами', (locale, serviceId) => {
    const faq = faqOf(locale, serviceId);

    expect(Array.isArray(faq)).toBe(true);
    expect(faq!.length).toBeGreaterThanOrEqual(4);

    for (const item of faq!) {
      expect(typeof item.question).toBe('string');
      expect(typeof item.answer).toBe('string');
      expect(item.question.trim()).not.toBe('');
      expect(item.answer.trim()).not.toBe('');
    }
  });

  it.each(SERVICES.map((service) => [service.id]))('%s: в ru и en одинаковое число вопросов', (serviceId) => {
    expect(faqOf('en', serviceId)?.length ?? 0).toBeGreaterThan(0);
    expect(faqOf('en', serviceId)?.length).toBe(faqOf('ru', serviceId)?.length);
  });

  it.each(['ru', 'en'])('%s: первые вопросы услуг попарно разные', (locale) => {
    const firstQuestions = SERVICES.map(
      (service) => serviceFaqJsonLd(MESSAGES[locale], service.id, locale)?.mainEntity[0]?.name,
    );

    expect(firstQuestions.every((name) => typeof name === 'string' && name !== '')).toBe(true);
    expect(new Set(firstQuestions).size).toBe(SERVICES.length);
  });

  it.each(TERM_ROWS)('%s, %s: срок тарифа в ответах — %j', (locale, serviceId, term) => {
    const answers = answersOf(locale, serviceId);

    expect(
      answers.some((answer) => hasTerm(answer, term)),
      `ответы: ${answers.join(' | ')}`,
    ).toBe(true);
  });

  it.each(['ru', 'en'])('%s: ответ о составе поддержки называет цены обоих уровней из прайса', (locale) => {
    const [first] = answersOf(locale, 'support');

    for (const price of SUPPORT_PRICES[locale]) {
      expect(first, `цена ${price}`).toContain(price);
    }
  });

  it.each(ROWS)('%s, %s: подстановки не протекают в JSON-LD — в ответах нет фигурных скобок', (locale, serviceId) => {
    const answers = answersOf(locale, serviceId);

    expect(answers.length).toBeGreaterThan(0);
    expect(answers.filter((answer) => /[{}]/.test(answer))).toEqual([]);
  });

  it('пустая пара пропускается, остальные остаются', () => {
    const messages: ServiceMessages = {
      services: {
        landing: {
          faq: [
            { question: 'Q1', answer: '  ' },
            { question: '', answer: 'A2' },
            { question: 'Q3', answer: 'A3' },
          ],
        },
      },
    };

    expect(serviceFaqJsonLd(messages, 'landing', 'ru')?.mainEntity).toEqual([
      { '@type': 'Question', name: 'Q3', acceptedAnswer: { '@type': 'Answer', text: 'A3' } },
    ]);
  });

  it('без пар с текстом, с пустым faq или без услуги в переводах — null, а не FAQPage с пустым mainEntity', () => {
    const messages: ServiceMessages = {
      services: {
        allEmpty: { faq: [{ question: ' ', answer: '' }] },
        noFaq: { faq: [] },
      },
    };

    expect(serviceFaqJsonLd(messages, 'allEmpty', 'ru')).toBeNull();
    expect(serviceFaqJsonLd(messages, 'noFaq', 'ru')).toBeNull();
    expect(serviceFaqJsonLd(messages, 'bogus', 'ru')).toBeNull();
  });
});

describe('сумма тарифа в тексты услуг не подставляется', () => {
  it.each([
    ['ru', ru],
    ['en', en],
  ] as const)('%s: в ответах FAQ и шагах услуг нет подстановки {price}', (_locale, messages) => {
    const texts = serviceTextsOf(messages);

    expect(texts.length).toBeGreaterThan(0);
    expect(texts.filter(([, text]) => text.includes('{price}')).map(([path]) => path)).toEqual([]);
  });

  it.each(ROWS)('%s, %s: строка {price} возвращается без изменений', (locale, serviceId) => {
    expect(fillServiceText('{price}', serviceId, locale)).toBe('{price}');
  });
});

describe('срок в FAQ берется из данных тарифа, а не из текста', () => {
  afterEach(() => {
    vi.doUnmock('@/content/pricing');
    vi.resetModules();
  });

  it.each([
    ['ru', `5${NBSP}дней`],
    ['en', '5 days'],
  ])('%s: у лендинга 5 дней в данных — в ответе %j', async (locale, term) => {
    vi.resetModules();
    vi.doMock('@/content/pricing', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/content/pricing')>();

      return {
        ...actual,
        PRICING_PLANS: actual.PRICING_PLANS.map((plan) => (plan.id === 'landing' ? { ...plan, days: 5 } : plan)),
      };
    });

    const { serviceFaqJsonLd: faqWithMock } = await import('@/content/services');
    const answers =
      faqWithMock(MESSAGES[locale], 'landing', locale)?.mainEntity.map((entry) => entry.acceptedAnswer.text) ?? [];

    expect(
      answers.some((answer) => hasTerm(answer, term)),
      `ответы: ${answers.join(' | ')}`,
    ).toBe(true);
  });
});
