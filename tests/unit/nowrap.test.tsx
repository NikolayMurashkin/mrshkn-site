import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { EditorialSection } from '@/designs/editorial';
import { KineticSection } from '@/designs/kinetic';
import { renderNowrap } from '@/designs/nowrap';
import { PopSection } from '@/designs/pop';
import { SwissSection } from '@/designs/swiss';
import { TerminalSection } from '@/designs/terminal';
import type { SectionProps } from '@/designs/types';
import ru from '../../messages/ru.json';

/**
 * «152-ФЗ» в пункте списка не рвется по дефису: токен «число-дефис-буквы» рисуется отдельным `span`
 * с `white-space: nowrap` направления, остальной текст пункта не теряется.
 */

vi.mock('next/font/local', () => ({ default: () => ({ className: '', style: {}, variable: '' }) }));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

type ProviderProps = { locale: string; timeZone: string; messages: typeof ru; children?: ReactNode };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const SECTIONS: [string, (props: SectionProps) => ReactNode][] = [
  ['kinetic', KineticSection],
  ['terminal', TerminalSection],
  ['pop', PopSection],
  ['swiss', SwissSection],
  ['editorial', EditorialSection],
];

const TOKEN = '152-ФЗ';

const markup = (node: ReactNode) =>
  renderToStaticMarkup(createElement(Provider, { locale: 'ru', timeZone: 'Europe/Moscow', messages: ru }, node));

/** Сколько раз токен встречается в тексте и сколько из них — целиком внутри своего `span`. */
const tokenCounts = (html: string) => ({
  total: html.split(TOKEN).length - 1,
  wrapped: [...html.matchAll(new RegExp(`<span\\b[^>]*>${TOKEN}</span>`, 'g'))].length,
});

describe('«152-ФЗ» без переноса по дефису', () => {
  it('renderNowrap оборачивает токен в span с классом и сохраняет текст пункта', () => {
    expect(renderToStaticMarkup(<>{renderNowrap(`Политика обработки данных по ${TOKEN}`, 'keep')}</>)).toBe(
      `Политика обработки данных по <span class="keep">${TOKEN}</span>`,
    );
  });

  it('renderNowrap оборачивает каждый токен и не трогает текст без токена', () => {
    expect(renderToStaticMarkup(<>{renderNowrap(`по ${TOKEN} и 63-ФЗ.`, 'keep')}</>)).toBe(
      `по <span class="keep">${TOKEN}</span> и <span class="keep">63-ФЗ</span>.`,
    );
    expect(renderToStaticMarkup(<>{renderNowrap('Cookie-баннер без номера', 'keep')}</>)).toBe(
      'Cookie-баннер без номера',
    );
  });

  it.each(SECTIONS)('%s: в блоке «Что входит» прайса главной токен целиком в своем span', (_design, Section) => {
    const counts = tokenCounts(markup(Section({ section: 'pricing' } as unknown as SectionProps)));

    expect(counts.total).toBeGreaterThan(0);
    expect(counts).toEqual({ total: counts.total, wrapped: counts.total });
  });

  it.each(SECTIONS)('%s: на странице услуги «Лендинг» токен целиком в своем span', (_design, Section) => {
    const counts = tokenCounts(
      markup(Section({ section: 'servicePage', service: 'landing' } as unknown as SectionProps)),
    );

    expect(counts.total).toBeGreaterThan(0);
    expect(counts).toEqual({ total: counts.total, wrapped: counts.total });
  });
});
