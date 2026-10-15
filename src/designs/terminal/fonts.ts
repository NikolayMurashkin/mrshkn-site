import localFont from 'next/font/local';

export const jetbrains = localFont({
  src: './fonts/jetbrains-mono.woff2',
  weight: '400 700',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'JetBrains Mono' }],
});

export const terminalSans = localFont({
  src: './fonts/terminal-sans.woff2',
  weight: '400 700',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Terminal Sans' }],
});

/**
 * Двойники тех же файлов для текста нижнего дока (cookie-баннер, пилюля «Стиль»): `optional` не подменяет шрифт
 * после первой отрисовки, и фиксированный док не меняет высоту. Файл и адрес те же — второй загрузки нет.
 */
export const jetbrainsDock = localFont({
  src: './fonts/jetbrains-mono.woff2',
  weight: '400 700',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'JetBrains Mono Dock' }],
});

export const terminalSansDock = localFont({
  src: './fonts/terminal-sans.woff2',
  weight: '400 700',
  display: 'optional',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Terminal Sans Dock' }],
});
