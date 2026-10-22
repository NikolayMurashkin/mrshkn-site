import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SERVICES } from '@/content/services';
import { Link, usePathname } from '@/i18n/navigation';
import { NAV_ITEMS, WORK_NAV_ITEM } from '../consts';
import { isWorkPath, navHref, visibleNavItems } from '../nav';
import type { HeaderProps } from '../types';
import { useActiveSection } from '../use-active-section';
import { SWISS_HEADER_OFFSET } from './consts';
import { SunIcon } from './icons';
import styles from './Header.module.scss';

export const SwissHeader = ({ hasCases }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const items = useMemo(() => visibleNavItems(NAV_ITEMS, hasCases), [hasCases]);
  const active = useActiveSection(items, pathname === '/', SWISS_HEADER_OFFSET);
  const onCase = isWorkPath(pathname);
  const onService = SERVICES.some((service) => pathname === `/${service.slug}`);

  const current = (item: string) => {
    if (onCase && item === WORK_NAV_ITEM) {
      return 'page';
    }

    if (onService && item === 'services') {
      return 'page';
    }

    return item === active ? 'true' : undefined;
  };

  return (
    <header className={styles.header}>
      <Link
        className={styles.wordmark}
        href="/"
        translate="no"
        data-testid="brand"
      >
        {t('brand.name')}
      </Link>
      <span
        className={styles.tagline}
        translate="no"
      >
        {t('brand.tagline')}
      </span>
      <nav className={styles.nav}>
        {items.map((item) => (
          <a
            key={item}
            href={navHref(locale, item)}
            aria-current={current(item)}
          >
            {t(`nav.${item}`)}
          </a>
        ))}
      </nav>
      <div className={styles.controls}>
        <LocaleSwitcher
          className={styles.locales}
          itemClassName={styles.locale}
          activeItemClassName={styles.locale}
        />
        <ThemeToggle className={styles.theme}>
          <SunIcon />
        </ThemeToggle>
      </div>
    </header>
  );
};
