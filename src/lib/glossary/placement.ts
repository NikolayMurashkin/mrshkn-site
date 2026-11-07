import { TERM_TOOLTIP_GAP, TERM_VIEWPORT_MARGIN } from './consts';
import type { PlaceTooltipParams, TooltipPlacement } from './types';

/**
 * Место подсказки в координатах окна: над словом и по центру его, у края окна — сдвиг внутрь, шире окна — сужение
 * до окна без двух отступов. Сверху не помещается — под словом; не помещается нигде — сторона, где места больше.
 * Пока слово хотя бы частично в окне, подсказка — в пределах окна по вертикали, даже если закроет слово; выше окна —
 * у верхнего отступа. Слово прокрутили целиком за край — подсказка стоит у слова и уезжает вместе с ним.
 */
export const placeTooltip = ({ anchor, tip, viewport }: PlaceTooltipParams): TooltipPlacement => {
  const maxWidth = Math.max(0, viewport.width - 2 * TERM_VIEWPORT_MARGIN);
  const width = Math.min(tip.width, maxWidth);
  const center = (anchor.left + anchor.right) / 2;
  const left = Math.min(
    Math.max(center - width / 2, TERM_VIEWPORT_MARGIN),
    viewport.width - TERM_VIEWPORT_MARGIN - width,
  );
  const above = anchor.top - TERM_TOOLTIP_GAP - tip.height;
  const below = anchor.bottom + TERM_TOOLTIP_GAP;
  const roomAbove = anchor.top - TERM_TOOLTIP_GAP - TERM_VIEWPORT_MARGIN;
  const roomBelow = viewport.height - TERM_VIEWPORT_MARGIN - below;
  const side = roomAbove >= tip.height || (roomBelow < tip.height && roomAbove > roomBelow) ? 'top' : 'bottom';
  const atWord = side === 'top' ? above : below;
  const wordVisible = anchor.bottom > 0 && anchor.top < viewport.height;
  const lowest = viewport.height - TERM_VIEWPORT_MARGIN - tip.height;
  const top = wordVisible ? Math.max(TERM_VIEWPORT_MARGIN, Math.min(atWord, lowest)) : atWord;

  return { left, top, side, maxWidth };
};
