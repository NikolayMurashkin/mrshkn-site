import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { filledFaq, SERVICES, serviceBriefHref } from '@/content/services';
import type { FaqItem } from '@/content/types';
import { TerminalSection } from '@/designs/terminal';
import type { SectionProps } from '@/designs/types';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

type Messages = typeof ru;

type ServiceTexts = { process: { title: string }[]; faq: FaqItem[] };

const MESSAGES: Record<string, Messages> = { ru, en: en as Messages };

type ProviderProps = { locale: string; messages: Messages; children?: ReactNode };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const render = (locale: string, service: string) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { locale, messages: MESSAGES[locale] },
      TerminalSection({ section: 'servicePage', service } as unknown as SectionProps),
    ),
  );

const decode = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

const textOf = (html: string) => decode(html.replace(/<[^>]*>/g, ''));

const headingsOf = (html: string) =>
  [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(([, inner]) => textOf(inner));

const serviceTexts = (locale: string, id: string) =>
  (MESSAGES[locale].services as unknown as Record<string, ServiceTexts>)[id];

const ROWS = SERVICES.flatMap((service) => (['ru', 'en'] as const).map((locale) => [locale, service.id] as const));

describe('страница услуги Terminal', () => {
  it.each(ROWS)('%s, %s: страница с data-testid и data-service услуги, в h1 название тарифа', (locale, id) => {
    const html = render(locale, id);
    const name = (MESSAGES[locale].pricing.plans as Record<string, { name: string }>)[id].name;

    expect(html).toContain('data-testid="service-page"');
    expect(html).toContain(`data-service="${id}"`);
    expect(headingsOf(html)[0]).toContain(name);
  });

  it.each(ROWS)('%s, %s: есть названия опций услуги, заголовки шагов процесса и вопросы FAQ', (locale, id) => {
    const text = textOf(render(locale, id));
    const service = SERVICES.find((item) => item.id === id)!;
    const optionNames = service.options.map(
      (option) => (MESSAGES[locale].pricing.options as Record<string, { name: string }>)[option].name,
    );
    const { process, faq } = serviceTexts(locale, id);

    expect(optionNames.length).toBeGreaterThan(0);

    for (const name of optionNames) {
      expect(text, `опция «${name}»`).toContain(name);
    }

    for (const step of process) {
      expect(text, `шаг «${step.title}»`).toContain(step.title);
    }

    for (const item of filledFaq(faq)) {
      expect(text, `вопрос «${item.question}»`).toContain(item.question);
    }
  });

  it.each(ROWS)('%s, %s: CTA ведет в квиз с предвыбором услуги', (locale, id) => {
    const html = render(locale, id);
    const service = SERVICES.find((item) => item.id === id)!;

    expect(html).toContain(`href="${serviceBriefHref(locale, service)}"`);
  });

  it('неизвестная услуга — пустая разметка', () => {
    expect(render('ru', 'unknown')).toBe('');
  });
});
