// @vitest-environment jsdom
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentType, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Terms } from '@/components/Term';
import styles from '@/designs/kinetic/Term.module.scss';
import { KineticTermScope } from '@/designs/kinetic/TermScope';
import ru from '../../messages/ru.json';

/**
 * Слово-подсказку браузер рисует атомарной кнопкой: строка рвется у ее края даже рядом с неразрывным пробелом.
 * Поэтому `Terms` склеивает слово с соседней пунктуацией и с текстом через неразрывный пробел в обертку без переноса
 * направления, а текст остается байт в байт как в источнике.
 */

type ProviderProps = { locale: string; timeZone: string; messages: unknown; children?: ReactNode };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const PRIVACY = ru.pricing.basics.privacy;

const BASICS_NOTE = ru.servicePage.basicsNote;

const render = (text: string) => {
  const html = renderToStaticMarkup(
    <Provider
      locale="ru"
      messages={ru}
      timeZone="Europe/Kaliningrad"
    >
      <KineticTermScope>
        <p>
          <Terms text={text} />
        </p>
      </KineticTermScope>
    </Provider>,
  );
  const root = document.createElement('div');

  root.innerHTML = html;
  root.querySelectorAll('[role="tooltip"]').forEach((tip) => tip.remove());

  return root;
};

/** Обертки склейки: элементы с классом без переноса вне кнопки (внутри кнопки — обертка токена «152-ФЗ»). */
const gluesOf = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(`span.${styles.termNowrap}`)].filter((span) => !span.closest('button'));

const glueWith = (root: HTMLElement, id: string) =>
  gluesOf(root).find((span) => span.querySelector(`button[data-term="${id}"]`) !== null);

describe('Terms: слово склеено с соседним текстом без переноса', () => {
  it('КОГДА в тексте «(152-ФЗ)» ТОГДА скобки и слово — в одной обертке без переноса', () => {
    expect(PRIVACY).toContain('(152-ФЗ)');

    const root = render(PRIVACY);
    const glue = glueWith(root, 'law152');

    expect(styles.termNowrap).toBeTruthy();
    expect(glue?.textContent).toBe('(152-ФЗ):');
  });

  it('КОГДА «домен — регистратору» с неразрывным пробелом перед тире ТОГДА «домен —» в одной обертке', () => {
    expect(BASICS_NOTE).toContain('домен — регистратору');

    const root = render(BASICS_NOTE);
    const glue = glueWith(root, 'domain');

    expect(glue?.textContent).toBe('домен —');
    expect(glue?.textContent).not.toContain(' ');
  });

  it('КОГДА слово отделено обычным пробелом ТОГДА обертки нет: строка может рваться', () => {
    const root = render(BASICS_NOTE);

    expect(root.querySelector('button[data-term="registrar"]')).not.toBeNull();
    expect(glueWith(root, 'registrar')).toBeUndefined();
    expect(gluesOf(root).every((span) => !/ /.test(span.textContent ?? ''))).toBe(true);
  });

  it.each([
    ['152-ФЗ', PRIVACY],
    ['домен — регистратору', BASICS_NOTE],
  ])('КОГДА «%s» ТОГДА текст без подсказок равен источнику байт в байт', (_, text) => {
    expect(render(text).textContent).toBe(text);
  });
});
