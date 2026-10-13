// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DesignSwitcher } from '@/components/DesignSwitcher';
import messages from '../../messages/ru.json';

/**
 * Меню «Стиль» с клавиатуры: на экране оно над кнопкой, но Tab от кнопки должен вести в пункты меню → в DOM меню
 * идет после кнопки. Escape закрывает меню и возвращает фокус на кнопку, иначе фокус теряется в body.
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/ru',
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}));

vi.mock('@/designs/registry', () => ({
  preloadDesign: vi.fn(() => Promise.resolve()),
}));

const renderSwitcher = () =>
  render(
    <NextIntlClientProvider
      locale="ru"
      timeZone="Europe/Moscow"
      messages={messages}
    >
      <DesignSwitcher design="kinetic" />
    </NextIntlClientProvider>,
  );

const openMenu = () => {
  const toggle = screen.getByTestId('design-switcher');

  fireEvent.click(toggle);

  return { toggle, menu: screen.getByTestId('design-menu') };
};

beforeEach(() => {
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('меню «Стиль» с клавиатуры', () => {
  it('открытое меню идет в DOM после кнопки-переключателя', () => {
    renderSwitcher();

    const { toggle, menu } = openMenu();

    const menuAfterToggle = Boolean(toggle.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(menuAfterToggle ? 'меню после кнопки' : 'меню до кнопки').toBe('меню после кнопки');
  });

  it('Escape из пункта меню закрывает меню и возвращает фокус на кнопку', () => {
    renderSwitcher();

    const { toggle, menu } = openMenu();
    const item = within(menu).getAllByRole('button')[0];

    item.focus();
    fireEvent.keyDown(item, { key: 'Escape', code: 'Escape' });

    expect({
      menuOpen: screen.queryByTestId('design-menu') !== null,
      focusOnToggle: document.activeElement === toggle,
    }).toEqual({ menuOpen: false, focusOnToggle: true });
  });
});
