import { Rubik } from 'next/font/google';

export const rubik = Rubik({
  subsets: ['cyrillic', 'latin'],
  weight: ['500', '700', '800', '900'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});
