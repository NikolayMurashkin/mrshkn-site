import localFont from 'next/font/local';

export const rubik = localFont({
  src: './fonts/rubik.woff2',
  weight: '500 900',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'font-family', value: 'Rubik' }],
});
