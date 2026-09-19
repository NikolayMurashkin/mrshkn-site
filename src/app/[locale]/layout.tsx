import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DesignSwitcher } from '@/components/DesignSwitcher';
import { getTheme } from '@/components/theme-server';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { LOCALES } from '@/i18n/consts';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/consts';
import { getSiteEnv, robotsMetadata } from '@/lib/site-env';
import '@/styles/globals.scss';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export const generateMetadata = async ({ params }: Omit<LocaleLayoutProps, 'children'>): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    title: t('title'),
    description: t('description'),
    robots: robotsMetadata(getSiteEnv()),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((item) => [item, `/${item}`])),
    },
  };
};

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const design = await getDesign();
  const theme = await getTheme(design);

  return (
    <html
      lang={locale}
      data-design={design}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider>
          <ThemeProvider defaultTheme={theme}>
            <DesignSection
              design={design}
              section="header"
            />
            {children}
            <DesignSection
              design={design}
              section="footer"
            />
            <DesignSwitcher design={design} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
