import { describe, expect, it, vi } from 'vitest';
import { GET as getLlmsFull } from '@/app/llms-full.txt/route';
import { GET as getLlms } from '@/app/llms.txt/route';
import { SERVICES, serviceFaqJsonLd } from '@/content/services';
import type { FaqItem, ServiceMessages } from '@/content/types';
import { LOCALES } from '@/i18n/consts';
import { SITE_URL } from '@/lib/consts';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

vi.mock('next-intl/server', async () => {
  const { createTranslator } = await import('next-intl');
  const messages: Record<string, unknown> = {
    ru: (await import('../../messages/ru.json')).default,
    en: (await import('../../messages/en.json')).default,
  };

  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace?: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace } as never),
    getMessages: async ({ locale }: { locale: string }) => messages[locale],
    setRequestLocale: () => {},
  };
});

vi.mock('@/cms/cases', () => ({
  getCases: async () => [],
  getCaseBySlug: async () => null,
  hasCases: async () => false,
}));

type PlanTexts = { name: string; summary: string };

type LocaleTexts = { brand: { name: string }; plans: Record<string, PlanTexts>; faq: Record<string, FaqItem[]> };

const textsOf = (messages: typeof ru): LocaleTexts => ({
  brand: messages.brand,
  plans: messages.pricing.plans as Record<string, PlanTexts>,
  faq: Object.fromEntries(
    Object.entries(messages.services as Record<string, { faq: FaqItem[] }>).map(([id, { faq }]) => [id, faq]),
  ),
});

const TEXTS: Record<string, LocaleTexts> = { ru: textsOf(ru), en: textsOf(en as typeof ru) };

const ROWS = SERVICES.flatMap((service) => LOCALES.map((locale) => [locale, service.id] as const));

const planOf = (id: string) => SERVICES.find((service) => service.id === id)!;

const MESSAGES: Record<string, ServiceMessages> = { ru: ru as ServiceMessages, en: en as ServiceMessages };

/** Ответы FAQ с подставленными сроком и ценами — как на странице услуги и в ее JSON-LD. */
const faqAnswers = (locale: string, id: string) =>
  serviceFaqJsonLd(MESSAGES[locale], id, locale)?.mainEntity.map((entry) => entry.acceptedAnswer.text) ?? [];

const serviceLink = (locale: string, id: string) =>
  `[${TEXTS[locale].plans[id].name}](${SITE_URL}/${locale}/${planOf(id).slug})`;

/** Блок услуги в llms-full.txt: от заголовка `## <название>` до следующего заголовка второго уровня. */
const planBlock = (body: string, name: string) => {
  const lines = body.split('\n');
  const start = lines.indexOf(`## ${name}`);

  if (start < 0) {
    return [];
  }

  const next = lines.findIndex((line, index) => index > start && line.startsWith('## '));

  return lines.slice(start, next < 0 ? undefined : next);
};

/** Срок в блоке услуги: у лендинга — из дней тарифа, у магазина — строка перевода. */
const TERM_LINES = [
  ['ru', 'landing', `4${String.fromCodePoint(0x00a0)}дня`],
  ['en', 'landing', '4 days'],
  ['ru', 'store', ru.pricing.plans.store.term],
  ['en', 'store', en.pricing.plans.store.term],
] as const;

const llmsText = async () => (await getLlms(new Request(`${SITE_URL}/llms.txt`))).text();

const llmsFullText = async () => (await getLlmsFull(new Request(`${SITE_URL}/llms-full.txt`))).text();

describe('/llms.txt', () => {
  it('L1: 200, text/plain в utf-8', async () => {
    const response = await getLlms(new Request(`${SITE_URL}/llms.txt`));
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

    expect(response.status).toBe(200);
    expect(contentType.startsWith('text/plain')).toBe(true);
    expect(contentType).toContain('charset=utf-8');
  });

  it('L2: первая строка — H1 с названием студии, есть цитата с кратким описанием', async () => {
    const lines = (await llmsText()).split('\n');

    expect(lines[0]).toBe(`# ${ru.brand.name}`);
    expect(lines.some((line) => /^> \S/.test(line))).toBe(true);
  });

  it.each(ROWS)('L3 %s, %s: ссылка на страницу услуги своего языка с названием тарифа', async (locale, id) => {
    expect(await llmsText()).toContain(serviceLink(locale, id));
  });

  it('L4: русский раздел раньше английского', async () => {
    const body = await llmsText();
    const firstLink = (locale: string) =>
      Math.min(
        ...SERVICES.map((service) => body.indexOf(serviceLink(locale, service.id))).filter((index) => index >= 0),
      );

    expect(Number.isFinite(firstLink('ru')), 'есть ru-ссылка на услугу').toBe(true);
    expect(Number.isFinite(firstLink('en')), 'есть en-ссылка на услугу').toBe(true);
    expect(firstLink('ru')).toBeLessThan(firstLink('en'));
  });
});

describe('/llms-full.txt', () => {
  it('F1: 200, text/plain в utf-8', async () => {
    const response = await getLlmsFull(new Request(`${SITE_URL}/llms-full.txt`));
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();

    expect(response.status).toBe(200);
    expect(contentType.startsWith('text/plain')).toBe(true);
    expect(contentType).toContain('charset=utf-8');
  });

  it.each(ROWS)('F2 %s, %s: название, краткое описание и весь FAQ услуги', async (locale, id) => {
    const body = await llmsFullText();
    const { name, summary } = TEXTS[locale].plans[id];
    const faq = TEXTS[locale].faq[id];
    const answers = faqAnswers(locale, id);

    expect(faq.length).toBeGreaterThan(0);
    expect(answers.length).toBe(faq.length);
    expect(body).toContain(name);
    expect(body).toContain(summary);

    for (const [index, { question }] of faq.entries()) {
      expect(body, `вопрос «${question}»`).toContain(question);
      expect(body, `ответ на «${question}»`).toContain(answers[index]);
    }
  });

  it.each(TERM_LINES)('%s, %s: строка срока в блоке услуги — %j', async (locale, id, term) => {
    const messages = locale === 'ru' ? ru : (en as typeof ru);
    const block = planBlock(await llmsFullText(), TEXTS[locale].plans[id].name);

    expect(block.length, 'блок услуги').toBeGreaterThan(0);
    expect(block).toContain(`- ${messages.pricing.columns.term}: ${term}`);
  });
});
