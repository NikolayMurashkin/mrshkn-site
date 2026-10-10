import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { hasCases } from '@/cms/cases';
import { DesignSwitcher } from '@/components/DesignSwitcher';
import { JsonLd } from '@/components/JsonLd';
import { getTheme } from '@/components/theme-server';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/consts';
import { organizationJsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { getSiteEnv, robotsMetadata } from '@/lib/site-env';
import '@/styles/globals.scss';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export const generateMetadata = async ({ params }: Omit<LocaleLayoutProps, 'children'>): Promise<Metadata> => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    robots: robotsMetadata(getSiteEnv()),
    ...pageMetadata({ locale, path: '', title: t('title'), description: t('description') }),
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
  const withCases = await hasCases(locale);

  return (
    <html
      lang={locale}
      data-design={design}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body>
        <JsonLd data={organizationJsonLd()} />
        <NextIntlClientProvider>
          <ThemeProvider defaultTheme={theme}>
            <DesignSection
              design={design}
              section="header"
              hasCases={withCases}
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
