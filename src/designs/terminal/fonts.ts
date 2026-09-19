import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

export const jetbrains = JetBrains_Mono({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

export const plex = IBM_Plex_Sans({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});
