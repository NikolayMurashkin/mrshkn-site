import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DESIGN_NAMES } from '@/designs/consts';

/**
 * Пилюля «Стиль» и cookie-баннер — в одном фиксированном доке внизу: пилюля стоит над баннером раскладкой дока
 * с первой отрисовки. Раньше пилюля поднималась на `--cookie-banner-space`, которую `useCookieBanner` пишет после
 * гидрации, — сдвиг fixed-элемента попадал в CLS на каждой странице первого визита (0,006–0,021).
 */

const read = (path: string) => readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8');

const ruleBody = (source: string, selector: string) => {
  const start = source.search(new RegExp(`^${selector.replace('.', '\\.')}\\s*\\{`, 'm'));
  if (start === -1) return '';
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(open + 1, index).replace(/\{[^{}]*\}/g, '');
  }
  return '';
};

const isFixed = (body: string) => /(^|[;\s])position\s*:\s*fixed/.test(body);

describe('нижний док: пилюля и cookie-баннер', () => {
  it('пилюля не позиционируется по --cookie-banner-space', () => {
    const lines = read('src/components/DesignSwitcher.module.scss')
      .split('\n')
      .flatMap((line, index) => (line.includes('--cookie-banner-space') ? [`${index + 1}: ${line.trim()}`] : []));

    expect(lines).toEqual([]);
  });

  it.each(DESIGN_NAMES)('%s — баннер не fixed сам, фиксирован док', (design) => {
    const lines = read(`src/designs/${design}/CookieBanner.module.scss`)
      .split('\n')
      .flatMap((line, index) => (/position\s*:\s*fixed/.test(line) ? [`${index + 1}: ${line.trim()}`] : []));

    expect(lines).toEqual([]);
  });

  it('layout ставит DesignSwitcher и секцию cookieBanner внутрь одного BottomDock', () => {
    const source = read('src/app/[locale]/layout.tsx');
    const open = source.indexOf('<BottomDock');
    const close = source.indexOf('</BottomDock>');
    const dock = open !== -1 && close > open ? source.slice(open, close) : '';

    expect({
      dock: dock.length > 0,
      switcher: dock.includes('<DesignSwitcher'),
      banner: /section=["']cookieBanner["']/.test(dock),
      switcherCount: source.split('<DesignSwitcher').length - 1,
      bannerCount: source.split(/section=["']cookieBanner["']/).length - 1,
    }).toEqual({ dock: true, switcher: true, banner: true, switcherCount: 1, bannerCount: 1 });
  });

  it('фиксирован сам док, пилюля стоит в нем раскладкой, а не своим position: fixed', () => {
    const dock = ruleBody(read('src/components/BottomDock.module.scss'), '.dock');
    const pill = ruleBody(read('src/components/DesignSwitcher.module.scss'), '.root');

    expect({
      dock: dock.length > 0,
      dockFixed: isFixed(dock),
      pill: pill.length > 0,
      pillFixed: isFixed(pill),
    }).toEqual({
      dock: true,
      dockFixed: true,
      pill: true,
      pillFixed: false,
    });
  });
});
