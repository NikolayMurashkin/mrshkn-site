import localFont from 'next/font/local';

export const rubik = localFont({
  src: './fonts/rubik.woff2',
  weight: '500 900',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Rubik' }],
});

/**
 * Двойники тех же файлов для текста нижнего дока (cookie-баннер, пилюля «Стиль»): `optional` не подменяет шрифт
 * после первой отрисовки, и фиксированный док не меняет высоту. Файл и адрес те же — второй загрузки нет.
 */
export const rubikDock = localFont({
  src: './fonts/rubik.woff2',
  weight: '500 900',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Rubik Dock' }],
});
