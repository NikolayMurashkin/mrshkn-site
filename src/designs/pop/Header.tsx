import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { MoonIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SERVICES } from '@/content/services';
import { NAV_ITEMS, WORK_NAV_ITEM } from '../consts';
import { visibleNavItems } from '../nav';
import type { HeaderProps } from '../types';
import { useActiveSection } from '../use-active-section';
import { Link, usePathname } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { POP_HEADER_OFFSET, WORK_PATH_PREFIX } from './consts';
import styles from './Header.module.scss';

export const PopHeader = ({ hasCases }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const items = useMemo(() => visibleNavItems(NAV_ITEMS, hasCases), [hasCases]);
  const onHome = pathname === '/';
  const active = useActiveSection(items, onHome, POP_HEADER_OFFSET);
  const onCase = pathname.startsWith(WORK_PATH_PREFIX);
  const onService = SERVICES.some((service) => pathname === `/${service.slug}`);

  const current = (item: string) => {
    if (onCase && item === WORK_NAV_ITEM) {
      return 'page';
    }

    if (onService && item === 'services') {
      return 'page';
    }

    return item === active ? 'location' : undefined;
  };

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
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
      </div>
      <nav className={styles.nav}>
        {items.map((item) => (
          <a
            key={item}
            href={`/${locale}#${item}`}
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
          activeItemClassName={`${styles.locale} ${styles.localeActive}`}
        />
        <ThemeToggle className={styles.theme}>
          <MoonIcon
            size={22}
            strokeWidth={2.2}
          />
        </ThemeToggle>
        <Link
          className={styles.cta}
          href={BRIEF_HREF}
        >
          {t('header.cta')}
        </Link>
      </div>
    </header>
  );
};
