import { describe, expect, it } from 'vitest';
import { TERM_TOOLTIP_GAP as GAP, TERM_VIEWPORT_MARGIN as MARGIN } from '@/lib/glossary/consts';
import { placeTooltip } from '@/lib/glossary/placement';

/**
 * Подсказка встает в координатах окна: по умолчанию над словом и по центру его, у края окна сдвигается внутрь,
 * шире окна — сужается до окна без отступов, сверху не помещается — встает под слово. На 360 px за край не выходит.
 */

/** Ширина подсказки на экране: больше `maxWidth` она не растет. */
const shownWidth = (tipWidth: number, maxWidth: number) => Math.min(tipWidth, maxWidth);

describe('placeTooltip', () => {
  it('36: КОГДА окно 1440×900, слово по центру и сверху места хватает ТОГДА над словом, центр подсказки — центр слова', () => {
    const anchor = { left: 700, right: 760, top: 450, bottom: 470 };
    const tip = { width: 280, height: 90 };
    const placement = placeTooltip({ anchor, tip, viewport: { width: 1440, height: 900 } });

    expect(placement.side).toBe('top');
    expect(placement.top).toBe(anchor.top - GAP - tip.height);
    expect(placement.left + tip.width / 2).toBe((anchor.left + anchor.right) / 2);
  });

  it('37: КОГДА окно 360 и слово у правого края ТОГДА правый край подсказки не дальше 360 − MARGIN', () => {
    const placement = placeTooltip({
      anchor: { left: 290, right: 352, top: 400, bottom: 420 },
      tip: { width: 280, height: 90 },
      viewport: { width: 360, height: 740 },
    });

    expect(placement.left + 280).toBeLessThanOrEqual(360 - MARGIN);
  });

  it('38: КОГДА окно 360 и слово у левого края ТОГДА левый край подсказки не ближе MARGIN', () => {
    const placement = placeTooltip({
      anchor: { left: 4, right: 70, top: 400, bottom: 420 },
      tip: { width: 280, height: 90 },
      viewport: { width: 360, height: 740 },
    });

    expect(placement.left).toBeGreaterThanOrEqual(MARGIN);
  });

  it('39: КОГДА подсказка шире окна ТОГДА maxWidth — окно без двух отступов, left = MARGIN', () => {
    const placement = placeTooltip({
      anchor: { left: 150, right: 210, top: 400, bottom: 420 },
      tip: { width: 400, height: 90 },
      viewport: { width: 360, height: 740 },
    });

    expect(placement.maxWidth).toBe(360 - 2 * MARGIN);
    expect(placement.left).toBe(MARGIN);
  });

  it('40: КОГДА слово у верха окна и сверху подсказка не помещается ТОГДА она под словом', () => {
    const tip = { width: 280, height: 90 };
    const anchor = {
      left: 600,
      right: 660,
      top: tip.height + GAP + MARGIN - 1,
      bottom: tip.height + GAP + MARGIN + 19,
    };
    const placement = placeTooltip({ anchor, tip, viewport: { width: 1440, height: 900 } });

    expect(placement.side).toBe('bottom');
    expect(placement.top).toBe(anchor.bottom + GAP);
  });

  it.each([
    ['у левого края', { left: 0, right: 48, top: 400, bottom: 420 }],
    ['по центру', { left: 130, right: 190, top: 400, bottom: 420 }],
    ['у правого края', { left: 262, right: 320, top: 400, bottom: 420 }],
  ])('41: КОГДА окно 320 и слово %s ТОГДА подсказка в пределах [MARGIN, 320 − MARGIN]', (_label, anchor) => {
    const tip = { width: 280, height: 90 };
    const placement = placeTooltip({ anchor, tip, viewport: { width: 320, height: 640 } });

    expect(placement.left).toBeGreaterThanOrEqual(MARGIN);
    expect(placement.left + shownWidth(tip.width, placement.maxWidth)).toBeLessThanOrEqual(320 - MARGIN);
  });
});
