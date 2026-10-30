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
import { useActiveSection } from '../use-active-section';
import { useMobileMenu } from '../use-mobile-menu';
import { Link, usePathname } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { POP_HEADER_OFFSET, POP_MENU_MAX_WIDTH } from './consts';
import { ArrowRightIcon, StarIcon } from './icons';
import styles from './Header.module.scss';

export const PopHeader = ({ hasCases }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const items = useMemo(() => visibleNavItems(NAV_ITEMS, hasCases), [hasCases]);
  const onHome = pathname === '/';
  const active = useActiveSection(items, onHome, POP_HEADER_OFFSET);
  const onCase = isWorkPath(pathname);
  const onService = SERVICES.some((service) => pathname === `/${service.slug}`);
  const menu = useMobileMenu(POP_MENU_MAX_WIDTH);

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
        <button
          {...menu.burgerProps}
          className={styles.burger}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path
              className={`${styles.burgerLine} ${styles.burgerTop}`}
              d="M4 6h16"
            />
            <path
              className={`${styles.burgerLine} ${styles.burgerMid}`}
              d="M4 12h16"
            />
            <path
              className={`${styles.burgerLine} ${styles.burgerBottom}`}
              d="M4 18h16"
            />
          </svg>
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
                  {t(`nav.${item}`)}
                  <ArrowRightIcon />
                </a>
              ))}
            </nav>
            <div className={styles.panelControls}>
              <LocaleSwitcher
                className={styles.locales}
                itemClassName={styles.locale}
                activeItemClassName={`${styles.locale} ${styles.localeActive}`}
              />
              <ThemeToggle className={`${styles.theme} ${styles.panelTheme}`}>
                <MoonIcon
                  size={22}
                  strokeWidth={2.2}
                />
              </ThemeToggle>
              <StarIcon
                className={styles.panelStar}
                size={56}
              />
            </div>
            <TelegramLink className={styles.panelTelegram}>{t('footer.telegram')}</TelegramLink>
          </>
        )}
      </div>
    </header>
  );
};
