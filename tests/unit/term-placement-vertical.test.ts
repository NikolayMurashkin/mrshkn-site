import { describe, expect, it } from 'vitest';
import { TERM_TOOLTIP_GAP as GAP, TERM_VIEWPORT_MARGIN as MARGIN } from '@/lib/glossary/consts';
import { placeTooltip } from '@/lib/glossary/placement';

/**
 * Низкое окно (телефон боком, 740×360): длинная подсказка не помещается ни над словом, ни под ним. Сторона остается
 * той, где места больше, а сама подсказка не выходит за верх и низ окна; выше окна — встает у верхнего отступа.
 * Так — пока слово хотя бы частично в окне: слово прокрутили за край — подсказка стоит у слова и уезжает с ним.
 */

const VIEWPORT = { width: 740, height: 360 };

const TIP = { width: 285, height: 176 };

describe('placeTooltip по вертикали', () => {
  it.each([
    ['посередине окна', { left: 300, right: 360, top: 170, bottom: 190 }],
    ['чуть выше середины', { left: 300, right: 360, top: 150, bottom: 170 }],
    ['чуть ниже середины', { left: 300, right: 360, top: 200, bottom: 220 }],
  ])(
    'КОГДА слово %s и подсказка не помещается ни сверху, ни снизу ТОГДА она в пределах окна без отступов',
    (_label, anchor) => {
      const placement = placeTooltip({ anchor, tip: TIP, viewport: VIEWPORT });

      expect(placement.top).toBeGreaterThanOrEqual(MARGIN);
      expect(placement.top + TIP.height).toBeLessThanOrEqual(VIEWPORT.height - MARGIN);
    },
  );

  it('КОГДА слово выше середины ТОГДА сторона — снизу, ниже середины — сверху: где места больше', () => {
    const higher = placeTooltip({
      anchor: { left: 300, right: 360, top: 150, bottom: 170 },
      tip: TIP,
      viewport: VIEWPORT,
    });
    const lower = placeTooltip({
      anchor: { left: 300, right: 360, top: 200, bottom: 220 },
      tip: TIP,
      viewport: VIEWPORT,
    });

    expect(higher.side).toBe('bottom');
    expect(lower.side).toBe('top');
  });

  it('КОГДА подсказка выше окна без двух отступов ТОГДА она у верхнего отступа', () => {
    const placement = placeTooltip({
      anchor: { left: 300, right: 360, top: 170, bottom: 190 },
      tip: { width: 285, height: 400 },
      viewport: VIEWPORT,
    });

    expect(placement.top).toBe(MARGIN);
  });

  it('КОГДА слово целиком выше окна ТОГДА подсказка под словом, без ограничения окном', () => {
    const anchor = { left: 300, right: 360, top: -60, bottom: -40 };
    const placement = placeTooltip({ anchor, tip: TIP, viewport: VIEWPORT });

    expect(placement.side).toBe('bottom');
    expect(placement.top).toBe(anchor.bottom + GAP);
  });

  it('КОГДА слово целиком ниже окна ТОГДА подсказка над словом, без ограничения окном', () => {
    const anchor = { left: 300, right: 360, top: 400, bottom: 420 };
    const placement = placeTooltip({ anchor, tip: TIP, viewport: VIEWPORT });

    expect(placement.side).toBe('top');
    expect(placement.top).toBe(anchor.top - GAP - TIP.height);
  });

  it('КОГДА слово ровно по нижнему краю окна ТОГДА оно уже за окном: подсказка над словом, без ограничения', () => {
    const anchor = { left: 300, right: 360, top: VIEWPORT.height, bottom: VIEWPORT.height + 20 };
    const placement = placeTooltip({ anchor, tip: { width: 285, height: 400 }, viewport: VIEWPORT });

    expect(placement.top).toBe(anchor.top - GAP - 400);
  });

  it.each([
    ['частично выше окна', { left: 300, right: 360, top: -10, bottom: 10 }],
    ['частично ниже окна', { left: 300, right: 360, top: 350, bottom: 370 }],
  ])(
    'КОГДА слово %s и подсказка выше окна ТОГДА она у верхнего отступа, ограничение окном работает',
    (_label, anchor) => {
      const placement = placeTooltip({ anchor, tip: { width: 285, height: 400 }, viewport: VIEWPORT });

      expect(placement.top).toBe(MARGIN);
    },
  );
});
