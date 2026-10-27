import { describe, expect, it } from 'vitest';
import { PRICING_BASICS, PRICING_OPTIONS } from '@/content/pricing';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type Locale = 'ru' | 'en';

type FaqItem = { question: string; answer: string };

type Entry = { path: string; text: string };

const MESSAGES: Record<Locale, unknown> = { ru, en };

/** Пробелы любого вида (обычный, U+00A0, U+202F) — в обычный: тексты сайта держат неразрывные пробелы. */
const normalize = (text: string) => text.replace(/\s/g, ' ');

const folded = (text: string) => normalize(text).toLowerCase();

/** Все строковые значения JSON рекурсивно, с путем; имена ключей не проверяются. */
const entriesOf = (value: unknown, path = ''): Entry[] => {
  if (typeof value === 'string') {
    return [{ path, text: value }];
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => entriesOf(child, path === '' ? key : `${path}.${key}`));
  }

  return [];
};

const valueAt = (locale: Locale, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => {
    if (node !== null && typeof node === 'object') {
      return (node as Record<string, unknown>)[key];
    }

    return undefined;
  }, MESSAGES[locale]);

const textAt = (locale: Locale, path: string): string => {
  const value = valueAt(locale, path);

  return typeof value === 'string' ? value : '';
};

const faqOf = (locale: Locale, service: string): FaqItem[] => {
  const value = valueAt(locale, `services.${service}.faq`);

  return Array.isArray(value) ? (value as FaqItem[]) : [];
};

/** Индекс пункта FAQ по тексту ru-вопроса; en берется по тому же индексу. */
const faqIndex = (service: string, questionPart: string) =>
  faqOf('ru', service).findIndex((item) => folded(item.question ?? '').includes(folded(questionPart)));

const faqAnswer = (locale: Locale, service: string, questionPart: string): Entry => {
  const index = faqIndex(service, questionPart);

  expect(index, `services.${service}.faq: нет вопроса с «${questionPart}»`).not.toBe(-1);

  return { path: `services.${service}.faq.${index}.answer`, text: faqOf(locale, service)[index]?.answer ?? '' };
};

const violators = (entries: Entry[], test: (text: string) => boolean) =>
  entries.filter((entry) => test(normalize(entry.text))).map((entry) => `${entry.path}: ${entry.text}`);

const RU_FORBIDDEN = ['прописан', 'созвон', 'обучени', 'звонк', 'видеосвяз'];

const EN_FORBIDDEN = [
  /written in(to)? the contract/i,
  /\b(a|the)\s+([\w-]+\s+)?call\b/i,
  /\bcalls\b/i,
  /\btraining\b/i,
  /\bone-hour\b/i,
];

/**
 * Услуги, у которых первый шаг идет «до старта»: задача обсуждается до договора, в ответ — смета, срок и проект
 * договора. У отраслевого сайта, лендинга, «Бизнеса» и шага главной первый шаг — старт по договору с предоплатой
 * и материалами: его текст дословно держит `deal-texts.test.ts`.
 */
const PROCESS_SERVICES = ['miniApp', 'store', 'mvp'];

const CONTRACT_PATHS = ['pricing.basics.deadline', 'process.contractNote', 'servicePage.cardPoints.deadline'];

/** Где срок «записываем в договор» по утвержденным текстам; в остальных местах — «фиксируем в договоре». */
const CONTRACT_RECORDED_RU = [
  'pricing.basics.deadline',
  'services.landing.faq.1.answer',
  'services.business.faq.3.answer',
  'services.industry.faq.2.answer',
  'services.miniApp.faq.3.answer',
];

/** Ответы FAQ, где называется срок: услуга и часть ru-вопроса. */
const CONTRACT_FAQ: [string, string][] = [
  ['landing', 'За сколько дней будет готов лендинг'],
  ['business', 'За сколько дней будет готов сайт «Бизнес»'],
  ['miniApp', 'кроме самого приложения'],
  ['industry', 'За сколько дней будет готов сайт для вашей сферы'],
];

const HOSTING_QUESTION = 'Где хранится сайт и кто за это платит?';

const LOCALES: Locale[] = ['ru', 'en'];

describe('тексты сайта: без созвонов и «прописан в договоре»', () => {
  it('ru: нет “прописан”, “созвон”, “обучени”, “звонк”, “видеосвяз”', () => {
    const found = violators(entriesOf(ru), (text) => RU_FORBIDDEN.some((part) => text.toLowerCase().includes(part)));

    expect(found).toEqual([]);
  });

  it('en: нет “written in(to) the contract”, звонков и training', () => {
    const found = violators(entriesOf(en), (text) => EN_FORBIDDEN.some((pattern) => pattern.test(text)));

    expect(found).toEqual([]);
  });

  it('созвон и обучение заменены текстом, а не удалены', () => {
    const training = {
      ru: folded(textAt('ru', 'pricing.basics.training')),
      en: folded(textAt('en', 'pricing.basics.training')),
    };

    expect(training.ru, 'ru pricing.basics.training').toContain('инструкц');
    expect(training.ru, 'ru pricing.basics.training').toContain('видео с экрана');
    expect(
      training.en.includes('screencast') || training.en.includes('video'),
      `en pricing.basics.training называет screencast или video: ${training.en}`,
    ).toBe(true);
    expect(
      training.en.includes('guide') || training.en.includes('instructions'),
      `en pricing.basics.training называет guide или instructions: ${training.en}`,
    ).toBe(true);

    const briefPaths = PROCESS_SERVICES.map((id) => `services.${id}.process.0.text`);

    for (const path of briefPaths) {
      expect(folded(textAt('ru', path)), `ru ${path}`).toContain('до старта');
      expect(folded(textAt('en', path)), `en ${path}`).toContain('before the start');
    }

    for (const path of ['brief.steps.product.note', 'brief.steps.design.note']) {
      expect(textAt('ru', path).trim(), `ru ${path}`).not.toBe('');
    }
  });
});

describe('CRM — только опцией', () => {
  it.each(LOCALES)('%s: база и “Бизнес” не называют CRM', (locale) => {
    const entries: Entry[] = [
      { path: 'pricing.basics.forms', text: textAt(locale, 'pricing.basics.forms') },
      { path: 'pricing.plans.business.summary', text: textAt(locale, 'pricing.plans.business.summary') },
      ...entriesOf(valueAt(locale, 'services.business.faq'), 'services.business.faq'),
      ...entriesOf(valueAt(locale, 'services.business.process'), 'services.business.process'),
    ];

    expect(textAt(locale, 'pricing.basics.forms').trim(), 'pricing.basics.forms').not.toBe('');
    expect(textAt(locale, 'pricing.plans.business.summary').trim(), 'pricing.plans.business.summary').not.toBe('');
    expect(faqOf(locale, 'business').length, 'services.business.faq').toBeGreaterThan(0);
    expect(violators(entries, (text) => text.toLowerCase().includes('crm'))).toEqual([]);
  });

  it('опция crm — 15 000–30 000 ₽ / $300–600, не в базе', () => {
    const crm = PRICING_OPTIONS.find((option) => option.id === 'crm');

    expect(crm, 'опция crm в PRICING_OPTIONS').toBeDefined();
    expect(crm!.price.from).toEqual({ rub: 15_000, usd: 300 });
    expect(crm!.price.to).toEqual({ rub: 30_000, usd: 600 });
    expect(crm!.monthly).toBeUndefined();
    expect(PRICING_BASICS).not.toContain('crm');
  });
});

describe('FAQ лендинга про ИИ-поиск', () => {
  it.each(LOCALES)('%s: ответ FAQ лендинга про ИИ-поиск — schema.org, llms.txt, OG, hreflang, без FAQ', (locale) => {
    const { path, text } = faqAnswer(locale, 'landing', 'нейросет');
    const answer = normalize(text);

    expect(answer, path).toContain('schema.org');
    expect(answer, path).toContain('llms.txt');
    expect(answer, path).toMatch(/\bOG\b/);
    expect(answer, path).toContain('hreflang');
    expect(answer.toLowerCase(), path).not.toContain('faq');

    const packName = locale === 'ru' ? 'Расширенный пакет' : textAt('en', 'pricing.options.geo.name');

    expect(packName.trim(), 'имя пакета').not.toBe('');
    expect(answer.toLowerCase(), path).toContain(folded(packName));
  });

  it.each(LOCALES)('%s: карточка geo называет FAQ-разметку', (locale) => {
    const note = normalize(textAt(locale, 'pricing.options.geo.note'));

    expect(note).toContain(locale === 'ru' ? 'FAQ-разметк' : 'FAQ markup');
  });
});

describe('хостинг оплачивается провайдеру', () => {
  it('ru: хостинг оплачивается провайдеру, от 2 000 ₽ в месяц', () => {
    const entries: [Entry, string[]][] = [
      [
        { path: 'pricing.basics.hosting', text: textAt('ru', 'pricing.basics.hosting') },
        ['от 2 000 ₽ в месяц', 'оплачиваете напрямую'],
      ],
      [
        faqAnswer('ru', 'support', HOSTING_QUESTION),
        [
          'от 2 000 ₽ в месяц',
          'аккаунт у провайдера оформлен на вас',
          'платите ему вы напрямую',
          'провайдеры могут менять цены',
        ],
      ],
    ];

    for (const [{ path, text }, parts] of entries) {
      const value = folded(text);

      for (const part of parts) {
        expect(value, path).toContain(part);
      }
    }
  });

  it('en: хостинг оплачивается провайдеру, без суммы в рублях', () => {
    const entries = [
      { path: 'pricing.basics.hosting', text: textAt('en', 'pricing.basics.hosting') },
      faqAnswer('en', 'support', HOSTING_QUESTION),
    ];

    for (const { path, text } of entries) {
      const value = normalize(text);

      expect(value, path).not.toMatch(/₽|\bRUB\b|\brubles?\b|\broubles?\b/i);
      expect(value.toLowerCase(), path).toContain('provider');
    }
  });
});

describe('срок и условия фиксируются в договоре', () => {
  it.each(LOCALES)('%s: срок и условия — “фиксируем в договоре”', (locale) => {
    const entries: Entry[] = [
      ...CONTRACT_PATHS.map((path) => ({ path, text: textAt(locale, path) })),
      ...CONTRACT_FAQ.map(([service, question]) => faqAnswer(locale, service, question)),
    ];
    const expected = (path: string) => {
      if (locale === 'en') {
        return 'in the contract';
      }

      return CONTRACT_RECORDED_RU.includes(path) ? 'записываем в договор' : 'фиксируем в договоре';
    };

    for (const { path, text } of entries) {
      expect(folded(text), path).toContain(expected(path));
    }
  });
});
