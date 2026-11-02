// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLegalLinks } from '@/components/use-legal-links';
import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';

/** Ссылки подвала на оферту и памятку: документы только на русском → на английских страницах ссылок нет (иначе 404). */

const wrapper = (locale: 'ru' | 'en', messages: object) => {
  const IntlWrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
    >
      {children}
    </NextIntlClientProvider>
  );

  return IntlWrapper;
};

afterEach(cleanup);

describe('useLegalLinks', () => {
  it('F1 ru: две ссылки — оферта и памятка, подписи из footer.*', () => {
    const { result } = renderHook(() => useLegalLinks(), { wrapper: wrapper('ru', ruMessages) });

    expect(result.current).toEqual([
      { href: '/docs/offer', label: ruMessages.footer.offer },
      { href: '/docs/how-we-work', label: ruMessages.footer.howWeWork },
    ]);
  });

  it('F1 en: ссылок нет', () => {
    const { result } = renderHook(() => useLegalLinks(), { wrapper: wrapper('en', enMessages) });

    expect(result.current).toEqual([]);
  });
});
