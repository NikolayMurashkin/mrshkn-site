import { Onest, Prata } from 'next/font/google';

export const prata = Prata({
  subsets: ['cyrillic', 'latin'],
  weight: '400',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const onest = Onest({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});
