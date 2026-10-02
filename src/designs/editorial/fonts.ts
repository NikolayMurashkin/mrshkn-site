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
