import { Golos_Text, Unbounded } from 'next/font/google';

export const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['700', '900'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const golos = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});
