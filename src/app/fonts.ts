import { Golos_Text, Unbounded } from 'next/font/google';

export const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['700', '900'],
  variable: '--font-unbounded',
  display: 'swap',
});

export const golosText = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-golos',
  display: 'swap',
});
