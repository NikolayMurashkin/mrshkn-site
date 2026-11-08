// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorialFooter } from '@/designs/editorial/Footer';
import { withEmailLinks } from '@/designs/email-links';
import { KineticFooter } from '@/designs/kinetic/Footer';
import { PopFooter } from '@/designs/pop/Footer';
import { SwissFooter } from '@/designs/swiss/Footer';
import { TerminalFooter } from '@/designs/terminal/Footer';
import type { DesignName } from '@/designs/types';
import { STUDIO_EMAIL, STUDIO_PHONE, STUDIO_PHONE_HREF } from '@/lib/consts';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';

/** Телефон студии в подвале и разметке организации, почта студии в тексте — ссылки (D79). */

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

const LOCALES = [
  ['ru', ruMessages],
  ['en', enMessages],
] as const;

afterEach(cleanup);

describe('телефон студии', () => {
  it('номер и адрес ссылки — из решения D79', () => {
    expect({ STUDIO_PHONE, STUDIO_PHONE_HREF }).toEqual({
      STUDIO_PHONE: '+7 900 051-44-23',
      STUDIO_PHONE_HREF: 'tel:+79000514423',
    });
  });

  it('подпись на русском — дословно из D79', () => {
    expect(ruMessages.footer.phoneLabel).toBe('Звоните или пишите');
  });

  it.each(
    FOOTERS.flatMap(([design, Footer]) =>
      LOCALES.map(([locale, messages]) => [design, locale, messages, Footer] as const),
    ),
  )('подвал %s, %s: ссылка tel: с подписью и номером', (_design, locale, messages, Footer) => {
    render(
      <NextIntlClientProvider
        locale={locale}
        timeZone="Europe/Moscow"
        messages={messages}
      >
        <Footer />
      </NextIntlClientProvider>,
    );

    const link = screen.getByRole('link', { name: `${messages.footer.phoneLabel} ${STUDIO_PHONE}` });

    expect(link.getAttribute('href')).toBe(STUDIO_PHONE_HREF);
  });

  it.each(['ru', 'en'] as const)('разметка организации, %s: telephone', (locale) => {
    expect(organizationJsonLd(locale).telephone).toBe(STUDIO_PHONE);
  });
});

describe('withEmailLinks', () => {
  const linksIn = (node: unknown) => {
    const { container } = render(<p>{node as string}</p>);

    return { container, links: [...container.querySelectorAll('a')] };
  };

  it('строка с адресом: адрес — ссылка mailto, текст вокруг на месте', () => {
    const { container, links } = linksIn(withEmailLinks(`Напишите на ${STUDIO_EMAIL} — ответим.`));

    expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toEqual([
      [`mailto:${STUDIO_EMAIL}`, STUDIO_EMAIL],
    ]);
    expect(container.textContent).toBe(`Напишите на ${STUDIO_EMAIL} — ответим.`);
  });

  it('адрес в конце и дважды: две ссылки, знаки препинания вне ссылки', () => {
    const { container, links } = linksIn(withEmailLinks(`${STUDIO_EMAIL}, и снова ${STUDIO_EMAIL}.`));

    expect(links).toHaveLength(2);
    expect(container.textContent).toBe(`${STUDIO_EMAIL}, и снова ${STUDIO_EMAIL}.`);
  });

  it('строка без адреса возвращается как есть', () => {
    expect(withEmailLinks('Заявка не ушла.')).toBe('Заявка не ушла.');
  });

  it('массив, как из t.rich: строки разбираются, элементы остаются', () => {
    const { container, links } = linksIn(withEmailLinks([<b key="b">Почта</b>, ` — ${STUDIO_EMAIL};`]));

    expect(container.querySelector('b')?.textContent).toBe('Почта');
    expect(links).toHaveLength(1);
    expect(container.textContent).toBe(`Почта — ${STUDIO_EMAIL};`);
  });
});
