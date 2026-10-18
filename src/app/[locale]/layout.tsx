import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { hasCases } from '@/cms/cases';
import { ConsentProvider } from '@/components/Analytics/ConsentProvider';
import { BottomDock } from '@/components/BottomDock';
import { DesignSwitcher } from '@/components/DesignSwitcher';
import { JsonLd } from '@/components/JsonLd';
import { getTheme } from '@/components/theme-server';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DesignSection } from '@/designs/registry';
import { getDesign } from '@/designs/server';
import { routing } from '@/i18n/routing';
import { getAnalyticsIds, getConsent } from '@/lib/analytics/server';
import { SITE_URL } from '@/lib/consts';
import { YANDEX_VERIFICATION } from '@/lib/seo/consts';
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
    verification: { yandex: YANDEX_VERIFICATION },
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
  const consent = await getConsent();
  const { metrikaId, gaId } = getAnalyticsIds();

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
            <ConsentProvider
              initialChoice={consent}
              metrikaId={metrikaId}
              gaId={gaId}
            >
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
              <BottomDock>
                <DesignSection
                  design={design}
                  section="cookieBanner"
                />
                <DesignSwitcher design={design} />
              </BottomDock>
            </ConsentProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
