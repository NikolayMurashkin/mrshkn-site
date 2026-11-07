// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { Term, Terms } from '@/components/Term';
import type { TermClasses } from '@/components/Term/types';
import ru from '../../messages/ru.json';

/**
 * Слово с подсказкой — кнопка: подсказка `role="tooltip"` связана с ней через `aria-describedby`, есть в разметке
 * сервера закрытой (`hidden`), открывается наведением, фокусом и тапом, закрывается Escape, тапом мимо и повторным
 * тапом. Открыта одна подсказка за раз. Вид — классы направления, библиотек подсказок нет.
 */

const CLASSES: TermClasses = { root: 'stub-root', button: 'stub-button', tooltip: 'stub-tooltip' };

const HOSTING_TEXT = 'Аренда места для сайта на компьютере, который круглые сутки подключен к интернету.';

const DOMAIN_TEXT = 'Адрес вашего сайта, например ваше-название.рф.';

const TOOLTIP_LIBRARIES = [
  /^@floating-ui\//,
  /^@popperjs\//,
  /^tippy\.js$/,
  /^@radix-ui\//,
  /^@headlessui\//,
  /^react-tooltip$/,
];

/** Словарь сообщений с двумя записями: `Terms` вне `TermScope` не размечает, даже когда словарь есть. */
const MESSAGES = {
  ...ru,
  glossary: {
    hosting: { word: 'хостинг', forms: ['хостинг'], text: HOSTING_TEXT },
    law152: { word: '152-ФЗ', forms: ['152-ФЗ'], text: 'Федеральный закон о персональных данных.' },
  },
};

const hosting = () => (
  <Term
    id="hosting"
    text={HOSTING_TEXT}
    classes={CLASSES}
  >
    хостинг
  </Term>
);

const parse = (html: string) => {
  const container = document.createElement('div');

  container.innerHTML = html;

  return container;
};

const buttonOf = (root: ParentNode, id = 'hosting') =>
  root.querySelector<HTMLButtonElement>(`button[data-term="${id}"]`) as HTMLButtonElement;

/** Подсказка кнопки — по ее `aria-describedby`. */
const tooltipOf = (button: HTMLButtonElement) =>
  button.ownerDocument.getElementById(button.getAttribute('aria-describedby') ?? '') as HTMLElement;

const isOpen = (button: HTMLButtonElement) => !tooltipOf(button).hasAttribute('hidden');

const mount = () => {
  const { container } = render(hosting());
  const button = buttonOf(container);

  expect(button, 'кнопка слова').not.toBeNull();
  expect(tooltipOf(button), 'подсказка кнопки').not.toBeNull();
  expect(isOpen(button), 'до действий подсказка закрыта').toBe(false);

  return { container, button };
};

afterEach(() => {
  cleanup();
});

describe('Term: разметка сервера', () => {
  it('25: SSR ТОГДА button[type=button][data-term] со словом, aria-describedby — id подсказки role=tooltip, она hidden, классы на своих элементах', () => {
    const root = parse(renderToStaticMarkup(hosting()));
    const button = root.querySelector<HTMLButtonElement>('button[type="button"][data-term="hosting"]');

    expect(button, 'кнопка слова').not.toBeNull();
    expect(button?.textContent).toBe('хостинг');

    const tooltips = root.querySelectorAll<HTMLElement>('[role="tooltip"]');

    expect(tooltips).toHaveLength(1);

    const [tooltip] = tooltips;

    expect(tooltip.id).not.toBe('');
    expect(button?.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.textContent).toBe(HOSTING_TEXT);
    expect(tooltip.hasAttribute('hidden')).toBe(true);

    const wrapper = root.firstElementChild as HTMLElement;

    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.classList.contains('stub-root')).toBe(true);
    expect(wrapper.contains(button)).toBe(true);
    expect(wrapper.contains(tooltip)).toBe(true);
    expect(button?.classList.contains('stub-button')).toBe(true);
    expect(tooltip.classList.contains('stub-tooltip')).toBe(true);
  });
});

describe('Term: открытие и закрытие', () => {
  it('26: КОГДА фокус на кнопке ТОГДА подсказка открыта; КОГДА фокус ушел ТОГДА закрыта', () => {
    const { button } = mount();

    act(() => button.focus());
    expect(isOpen(button)).toBe(true);

    act(() => button.blur());
    expect(isOpen(button)).toBe(false);
  });

  it('27: КОГДА указатель на корне ТОГДА открыта; ушел с корня — закрыта; с кнопки на саму подсказку — остается открытой', () => {
    const { container, button } = mount();
    const root = container.querySelector('.stub-root') as HTMLElement;

    fireEvent.mouseEnter(root);
    expect(isOpen(button)).toBe(true);

    fireEvent.mouseLeave(root);
    expect(isOpen(button)).toBe(false);

    fireEvent.mouseEnter(root);
    fireEvent.mouseEnter(button);
    expect(isOpen(button)).toBe(true);

    const tooltip = tooltipOf(button);

    fireEvent.mouseLeave(button, { relatedTarget: tooltip });
    fireEvent.mouseEnter(tooltip, { relatedTarget: button });
    expect(isOpen(button)).toBe(true);
  });

  it('28: КОГДА тап по кнопке ТОГДА открыта; КОГДА второй тап ТОГДА закрыта', () => {
    const { button } = mount();

    fireEvent.click(button);
    expect(isOpen(button)).toBe(true);

    fireEvent.click(button);
    expect(isOpen(button)).toBe(false);
  });

  it('29: КОГДА подсказка открыта и тап мимо ТОГДА закрыта', () => {
    const { button } = mount();

    fireEvent.click(button);
    expect(isOpen(button)).toBe(true);

    fireEvent.pointerDown(document.body);
    expect(isOpen(button)).toBe(false);
  });

  it('30: КОГДА подсказка открыта и нажат Escape ТОГДА закрыта, фокус остается на кнопке', () => {
    const { button } = mount();

    act(() => button.focus());
    expect(isOpen(button)).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(isOpen(button)).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('31: КОГДА открыта первая подсказка и тап по второму слову ТОГДА первая закрыта, вторая открыта', () => {
    const { container } = render(
      <p>
        {hosting()}
        {' и '}
        <Term
          id="domain"
          text={DOMAIN_TEXT}
          classes={CLASSES}
        >
          домен
        </Term>
      </p>,
    );
    const first = buttonOf(container, 'hosting');
    const second = buttonOf(container, 'domain');

    expect(first, 'первая кнопка').not.toBeNull();
    expect(second, 'вторая кнопка').not.toBeNull();

    fireEvent.click(first);
    expect(isOpen(first)).toBe(true);

    fireEvent.pointerDown(second);
    fireEvent.click(second);
    expect(isOpen(first)).toBe(false);
    expect(isOpen(second)).toBe(true);
  });
});

describe('Term: связь кнопки и подсказки, nowrap', () => {
  it('32: КОГДА два Term с одним id словаря ТОГДА у подсказок разные id, у каждой кнопки свой aria-describedby', () => {
    const root = parse(
      renderToStaticMarkup(
        <p>
          {hosting()} и {hosting()}
        </p>,
      ),
    );
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('button[data-term="hosting"]')];
    const tooltips = [...root.querySelectorAll<HTMLElement>('[role="tooltip"]')];

    expect(buttons).toHaveLength(2);
    expect(tooltips).toHaveLength(2);
    expect(tooltips[0].id).not.toBe('');
    expect(tooltips[0].id).not.toBe(tooltips[1].id);
    expect(buttons.map((button) => button.getAttribute('aria-describedby'))).toEqual(
      tooltips.map((tooltip) => tooltip.id),
    );
  });

  it('33: КОГДА nowrap ТОГДА слово внутри кнопки — span с классом nowrap', () => {
    const root = parse(
      renderToStaticMarkup(
        <Term
          id="law152"
          text="Федеральный закон о персональных данных."
          classes={CLASSES}
          nowrap
          nowrapClassName="keep"
        >
          152-ФЗ
        </Term>,
      ),
    );

    expect(buttonOf(root, 'law152')?.innerHTML).toBe('<span class="keep">152-ФЗ</span>');
  });

  it('34: КОГДА Terms вне TermScope ТОГДА текст без кнопок, токены nowrap — в span', () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider
        locale="ru"
        timeZone="Europe/Moscow"
        messages={MESSAGES}
      >
        <Terms
          text="хостинг по 152-ФЗ и 63-ФЗ"
          nowrapClassName="keep"
        />
      </NextIntlClientProvider>,
    );

    expect(html).toBe('хостинг по <span class="keep">152-ФЗ</span> и <span class="keep">63-ФЗ</span>');
  });

  it('35: КОГДА читаем package.json ТОГДА библиотек подсказок нет ни в dependencies, ни в devDependencies', () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];

    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((name) => TOOLTIP_LIBRARIES.some((pattern) => pattern.test(name)))).toEqual([]);
  });
});
