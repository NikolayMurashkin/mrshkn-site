// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsentContext } from '@/components/Analytics/context';
import { NO_CONSENT } from '@/components/Analytics/consts';
import { EditorialFooter } from '@/designs/editorial/Footer';
import { KineticFooter } from '@/designs/kinetic/Footer';
import { PopFooter } from '@/designs/pop/Footer';
import { SwissFooter } from '@/designs/swiss/Footer';
import { TerminalFooter } from '@/designs/terminal/Footer';
import type { DesignName } from '@/designs/types';
import { GOALS } from '@/lib/analytics/consts';
import { TELEGRAM_URL } from '@/lib/consts';
import messages from '../../messages/ru.json';

/**
 * Кнопка «Написать в Telegram» в подвале каждого направления: ведет на публичный адрес студии в новой вкладке
 * и на клик отдает цель `telegram_click` в счетчики.
 */

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  Link: ({ children }: { children: unknown }) => children,
}));

const FOOTERS: [DesignName, ComponentType][] = [
  ['kinetic', KineticFooter],
  ['terminal', TerminalFooter],
  ['pop', PopFooter],
  ['swiss', SwissFooter],
  ['editorial', EditorialFooter],
];

afterEach(cleanup);

describe('кнопка Telegram в подвале', () => {
  it.each(FOOTERS)('%s: ссылка на студию в новой вкладке, клик — цель telegramClick', (_design, Footer) => {
    const reachGoal = vi.fn();

    render(
      <NextIntlClientProvider
        locale="ru"
        timeZone="Europe/Moscow"
        messages={messages}
      >
        <ConsentContext.Provider value={{ ...NO_CONSENT, reachGoal }}>
          <Footer />
        </ConsentContext.Provider>
      </NextIntlClientProvider>,
    );

    const link = screen.getByRole('link', { name: /^Написать в\sTelegram$/ });

    expect({
      href: link.getAttribute('href'),
      target: link.getAttribute('target'),
      rel: link.getAttribute('rel'),
    }).toEqual({ href: TELEGRAM_URL, target: '_blank', rel: 'noopener noreferrer' });

    fireEvent.click(link);

    expect(reachGoal.mock.calls).toEqual([[GOALS.telegramClick]]);
  });
});
