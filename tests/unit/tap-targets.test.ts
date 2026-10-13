import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Касание на телефоне: без `touch-action: manipulation` браузер ждет второго касания (масштаб двойным тапом)
 * и кнопка срабатывает с задержкой; `-webkit-tap-highlight-color` убирает серую вспышку WebKit поверх своих
 * состояний нажатия. Оба правила — в базовых стилях сайта.
 */

const GLOBALS = fileURLToPath(new URL('../../src/styles/globals.scss', import.meta.url));

describe('касания на сенсорных экранах', () => {
  it('globals.scss задает touch-action: manipulation и -webkit-tap-highlight-color', () => {
    const source = readFileSync(GLOBALS, 'utf8');

    expect({
      touchAction: /(?<![\w-])touch-action\s*:\s*manipulation\b/.test(source),
      tapHighlight: /-webkit-tap-highlight-color\s*:/.test(source),
    }).toEqual({ touchAction: true, tapHighlight: true });
  });
});
