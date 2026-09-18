import { Geologica, Golos_Text, IBM_Plex_Sans, JetBrains_Mono, Onest, Prata, Rubik, Unbounded } from 'next/font/google';
import type { DesignName } from './types';

const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['700', '900'],
  variable: '--font-unbounded',
  display: 'swap',
});

const golos = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-golos',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
  preload: false,
});

const plex = IBM_Plex_Sans({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
  preload: false,
});

const rubik = Rubik({
  subsets: ['cyrillic', 'latin'],
  weight: ['500', '700', '800', '900'],
  variable: '--font-rubik',
  display: 'swap',
  preload: false,
});

const geologica = Geologica({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-geologica',
  display: 'swap',
  preload: false,
});

const prata = Prata({
  subsets: ['cyrillic', 'latin'],
  weight: '400',
  variable: '--font-prata',
  display: 'swap',
  preload: false,
});

const onest = Onest({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-onest',
  display: 'swap',
  preload: false,
});

export const DESIGN_FONT_CLASSES: Record<DesignName, string> = {
  kinetic: `${unbounded.variable} ${golos.variable}`,
  terminal: `${jetbrains.variable} ${plex.variable}`,
  pop: rubik.variable,
  swiss: geologica.variable,
  editorial: `${prata.variable} ${onest.variable}`,
};
