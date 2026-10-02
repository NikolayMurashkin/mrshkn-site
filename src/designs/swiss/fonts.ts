import localFont from 'next/font/local';

export const geologica = localFont({
  src: './fonts/geologica.woff2',
  weight: '300 800',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Geologica' }],
});
