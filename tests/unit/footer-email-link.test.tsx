// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorialFooter } from '@/designs/editorial/Footer';
import { KineticFooter } from '@/designs/kinetic/Footer';
import { PopFooter } from '@/designs/pop/Footer';
import { SwissFooter } from '@/designs/swiss/Footer';
import type { DesignName } from '@/designs/types';
import { STUDIO_EMAIL } from '@/lib/consts';
import messages from '../../messages/ru.json';

/** Почта студии в подвале — ссылка `mailto:` во всех направлениях, где она показана (у Terminal почты в подвале нет). */

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  Link: ({ children }: { children: unknown }) => children,
}));

const FOOTERS: [DesignName, ComponentType][] = [
  ['kinetic', KineticFooter],
  ['pop', PopFooter],
  ['swiss', SwissFooter],
  ['editorial', EditorialFooter],
];

afterEach(cleanup);

describe('почта в подвале', () => {
  it.each(FOOTERS)('%s: адрес студии — ссылка mailto', (_design, Footer) => {
    render(
      <NextIntlClientProvider
        locale="ru"
        timeZone="Europe/Moscow"
        messages={messages}
      >
        <Footer />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: STUDIO_EMAIL }).getAttribute('href')).toBe(`mailto:${STUDIO_EMAIL}`);
  });
});
