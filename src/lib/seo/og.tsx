import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { BRAND_NAME, OG_COLORS, OG_DESCRIPTION_LINES, OG_FONTS, OG_SIZE, OG_TITLE_SIZES } from './consts';
import type { OgCardViewProps } from './types';

/**
 * Пути — литералами от `process.cwd()`: так их видит трассировка standalone-сборки и кладет файлы в образ.
 * Шрифты читаются один раз на процесс.
 */
const fonts = Promise.all([
  readFile(join(process.cwd(), 'src/designs/kinetic/fonts/unbounded-900.ttf')),
  readFile(join(process.cwd(), 'src/designs/kinetic/fonts/golos-text-400.ttf')),
  readFile(join(process.cwd(), 'src/designs/kinetic/fonts/golos-text-600.ttf')),
]).then(([display, text, tag]) => [
  { ...OG_FONTS.display, data: display, style: 'normal' as const },
  { ...OG_FONTS.text, data: text, style: 'normal' as const },
  { ...OG_FONTS.tag, data: tag, style: 'normal' as const },
]);

const titleSize = (title: string) =>
  (OG_TITLE_SIZES.find(({ maxLength }) => title.length <= maxLength) ?? OG_TITLE_SIZES[OG_TITLE_SIZES.length - 1])
    .fontSize;

/** Карточка в стиле Kinetic: знак и плашка сверху, прописной заголовок Unbounded, подпись Golos Text, лента акцента. */
const OgCardView = ({ kicker, title, description }: OgCardViewProps) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: OG_COLORS.bg,
      color: OG_COLORS.ink,
      fontFamily: OG_FONTS.text.name,
    }}
  >
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px 56px',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <div
          style={{
            fontFamily: OG_FONTS.display.name,
            fontWeight: OG_FONTS.display.weight,
            fontSize: 34,
            letterSpacing: '0.04em',
          }}
        >
          {BRAND_NAME}
        </div>
        {kicker ? (
          <div
            style={{
              display: 'flex',
              padding: '12px 28px',
              borderRadius: 999,
              background: OG_COLORS.accent,
              color: OG_COLORS.accentContrast,
              fontFamily: OG_FONTS.tag.name,
              fontWeight: OG_FONTS.tag.weight,
              fontSize: 30,
            }}
          >
            {kicker}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>
        <div
          style={{
            fontFamily: OG_FONTS.display.name,
            fontWeight: OG_FONTS.display.weight,
            fontSize: titleSize(title),
            lineHeight: 1.17,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            wordBreak: 'break-word',
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              display: 'block',
              fontWeight: OG_FONTS.text.weight,
              fontSize: 30,
              lineHeight: 1.45,
              color: OG_COLORS.muted,
              wordBreak: 'break-word',
              lineClamp: OG_DESCRIPTION_LINES,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
    <div style={{ height: 16, background: OG_COLORS.accent }} />
  </div>
);

export const renderOgImage = async (card: OgCardViewProps) =>
  new ImageResponse(<OgCardView {...card} />, { ...OG_SIZE, fonts: await fonts });

/** Сегмент с неизвестным языком, услугой или кейсом: картинки нет. */
export const missingOgImage = () => new Response(null, { status: 404 });
