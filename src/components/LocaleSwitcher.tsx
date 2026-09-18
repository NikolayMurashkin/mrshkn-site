'use client';

import { useLocale } from 'next-intl';
import { LOCALES } from '@/i18n/consts';
import { Link, usePathname } from '@/i18n/navigation';
import styles from './SiteControls.module.scss';

export const LocaleSwitcher = () => {
  const pathname = usePathname();
  const activeLocale = useLocale();

  return (
    <div className={styles.locales}>
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          data-testid={`locale-${locale}`}
          className={locale === activeLocale ? styles.localeActive : styles.locale}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
};
