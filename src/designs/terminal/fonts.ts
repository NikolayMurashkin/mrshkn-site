import localFont from 'next/font/local';

export const jetbrains = localFont({
  src: './fonts/jetbrains-mono.woff2',
  weight: '400 700',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'JetBrains Mono' }],
});

export const plex = localFont({
  src: './fonts/ibm-plex-sans.woff2',
  weight: '400 700',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'IBM Plex Sans' }],
});
