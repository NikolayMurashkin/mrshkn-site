import localFont from 'next/font/local';

export const unbounded = localFont({
  src: './fonts/unbounded.woff2',
  weight: '700 900',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Unbounded' }],
});

export const golos = localFont({
  src: './fonts/golos-text.woff2',
  weight: '400 600',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Golos Text' }],
});

/**
 * Двойники тех же файлов для текста нижнего дока (cookie-баннер, пилюля «Стиль»): `optional` не подменяет шрифт
 * после первой отрисовки, и фиксированный док не меняет высоту. Файл и адрес те же — второй загрузки нет.
 */
export const unboundedDock = localFont({
  src: './fonts/unbounded.woff2',
  weight: '700 900',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Unbounded Dock' }],
});

export const golosDock = localFont({
  src: './fonts/golos-text.woff2',
  weight: '400 600',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Golos Text Dock' }],
});
