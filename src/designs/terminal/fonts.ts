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
