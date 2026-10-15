import localFont from 'next/font/local';

export const prata = localFont({
  src: './fonts/prata.woff2',
  weight: '400',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Prata' }],
});

export const onest = localFont({
  src: './fonts/onest.woff2',
  weight: '400 600',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Onest' }],
});

/**
 * Двойники тех же файлов для текста нижнего дока (cookie-баннер, пилюля «Стиль»): `optional` не подменяет шрифт
 * после первой отрисовки, и фиксированный док не меняет высоту. Файл и адрес те же — второй загрузки нет.
 */
export const prataDock = localFont({
  src: './fonts/prata.woff2',
  weight: '400',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Prata Dock' }],
});

export const onestDock = localFont({
  src: './fonts/onest.woff2',
  weight: '400 600',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Onest Dock' }],
});
