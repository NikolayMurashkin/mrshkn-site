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
