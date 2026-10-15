import localFont from 'next/font/local';

export const geologica = localFont({
  src: './fonts/geologica.woff2',
  weight: '300 800',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Geologica' }],
});

/**
 * Двойники тех же файлов для текста нижнего дока (cookie-баннер, пилюля «Стиль»): `optional` не подменяет шрифт
 * после первой отрисовки, и фиксированный док не меняет высоту. Файл и адрес те же — второй загрузки нет.
 */
export const geologicaDock = localFont({
  src: './fonts/geologica.woff2',
  weight: '300 800',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Geologica Dock' }],
});
