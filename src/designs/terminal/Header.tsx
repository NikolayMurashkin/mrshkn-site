import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { MoonIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { TelegramLink } from '@/components/TelegramLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SERVICES } from '@/content/services';
import { NAV_ITEMS, WORK_NAV_ITEM } from '../consts';
import { isWorkPath, navHref, visibleNavItems } from '../nav';
import type { HeaderProps } from '../types';
import { Link, usePathname } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { useActiveSection } from '../use-active-section';
import { useMobileMenu } from '../use-mobile-menu';
import { ANCHOR_OFFSET, TERMINAL_MENU_MAX_WIDTH } from './consts';
import styles from './Header.module.scss';

export const TerminalHeader = ({ hasCases }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const items = useMemo(() => visibleNavItems(NAV_ITEMS, hasCases), [hasCases]);
  const onHome = pathname === '/';
  const active = useActiveSection(items, onHome, ANCHOR_OFFSET);
  const onCase = isWorkPath(pathname);
  const onService = SERVICES.some((service) => pathname === `/${service.slug}`);
  const menu = useMobileMenu(TERMINAL_MENU_MAX_WIDTH);

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
    <header className={menu.open ? `${styles.header} ${styles.open}` : styles.header}>
      <div className={styles.brand}>
        <Link
          className={styles.wordmark}
          href="/"
          translate="no"
          data-testid="brand"
        >
          <span className={styles.path}>~/</span>
          {t('brand.name')}
        </Link>
        <span className={styles.tagline}>{t('brand.tagline')}</span>
      </div>
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
          activeItemClassName={styles.localeActive}
        />
        <ThemeToggle className={styles.theme}>
          <MoonIcon size={20} />
        </ThemeToggle>
        <span className={styles.status}>
          <span className={styles.dot} />
          {t('header.status')}
        </span>
        <Link
          className={styles.cta}
          href={BRIEF_HREF}
        >
          {t('header.cta')}
        </Link>
        <button
          {...menu.burgerProps}
          className={styles.burger}
        >
          <span
            className={styles.burgerIcon}
            aria-hidden="true"
          />
        </button>
      </div>
      <div
        {...menu.panelProps}
        className={styles.panel}
      >
        {menu.open && (
          <>
            <nav className={styles.panelNav}>
              {items.map((item) => (
                <a
                  key={item}
                  href={navHref(locale, item)}
                  aria-current={current(item)}
                  onClick={menu.onNavigate}
                >
                  <span className={styles.panelLabel}>{t(`nav.${item}`)}</span>
                </a>
              ))}
            </nav>
            <div className={styles.panelControls}>
              <LocaleSwitcher
                className={styles.locales}
                itemClassName={styles.locale}
                activeItemClassName={styles.localeActive}
              />
              <ThemeToggle className={styles.theme}>
                <MoonIcon size={20} />
              </ThemeToggle>
            </div>
            <TelegramLink className={styles.panelTelegram}>
              {t('footer.telegram')} <span aria-hidden="true">→</span>
            </TelegramLink>
          </>
        )}
      </div>
    </header>
  );
};
