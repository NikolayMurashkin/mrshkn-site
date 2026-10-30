import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { MoonIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { TelegramLink } from '@/components/TelegramLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SERVICES } from '@/content/services';
import { Link, usePathname } from '@/i18n/navigation';
import { NAV_ITEMS, WORK_NAV_ITEM } from '../consts';
import { isWorkPath, navHref, visibleNavItems } from '../nav';
import type { HeaderProps } from '../types';
import { useActiveSection } from '../use-active-section';
import { useMatchMedia } from '../use-match-media';
import { useMobileMenu } from '../use-mobile-menu';
import { EDITORIAL_MENU_MAX_WIDTH, EDITORIAL_MENUBAR_OFFSET, EDITORIAL_NAV_OFFSET } from './consts';
import { ArrowRightIcon } from './icons';
import styles from './Header.module.scss';

export const EditorialHeader = ({ hasCases }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const items = useMemo(() => visibleNavItems(NAV_ITEMS, hasCases), [hasCases]);
  const narrow = useMatchMedia(`(max-width: ${EDITORIAL_MENU_MAX_WIDTH}px)`);
  const active = useActiveSection(items, pathname === '/', narrow ? EDITORIAL_MENUBAR_OFFSET : EDITORIAL_NAV_OFFSET);
  const onCase = isWorkPath(pathname);
  const onService = SERVICES.some((service) => pathname === `/${service.slug}`);
  const menu = useMobileMenu(EDITORIAL_MENU_MAX_WIDTH);

  const current = (item: string) => {
    if (onCase && item === WORK_NAV_ITEM) {
      return 'page';
    }

    if (onService && item === 'services') {
      return 'page';
    }

    return item === active ? 'true' : undefined;
  };

  const runningHead = items.find((item) => current(item));

  return (
    <header className={menu.open ? `${styles.header} ${styles.open}` : styles.header}>
      <div className={styles.masthead}>
        <div className={styles.caps}>
          <span className={styles.kicker}>{t('header.kicker')}</span>
          <span className={styles.location}>{t('header.location')}</span>
          <div className={styles.controls}>
            <LocaleSwitcher
              className={styles.locales}
              itemClassName={styles.locale}
              activeItemClassName={styles.locale}
            />
            <ThemeToggle className={styles.theme}>
              <MoonIcon
                size={18}
                strokeWidth={1.6}
              />
            </ThemeToggle>
          </div>
        </div>
        <Link
          className={styles.wordmark}
          href="/"
          translate="no"
          data-testid="brand"
        >
          {t('brand.name')}
        </Link>
        <span className={styles.tagline}>
          <span translate="no">{t('brand.tagline')}</span>
          <span
            className={styles.taglineSep}
            aria-hidden="true"
          >
            {' · '}
          </span>
          <span>{t('header.founded')}</span>
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
      <div className={styles.menubar}>
        <span
          className={styles.runningHead}
          aria-hidden="true"
        >
          {runningHead ? t(`nav.${runningHead}`) : null}
        </span>
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
            <nav>
              <ul className={styles.panelList}>
                {items.map((item) => (
                  <li key={item}>
                    <a
                      className={styles.panelLink}
                      href={navHref(locale, item)}
                      aria-current={current(item)}
                      onClick={menu.onNavigate}
                    >
                      <span className={styles.panelLabel}>{t(`nav.${item}`)}</span>
                      <ArrowRightIcon className={styles.panelArrow} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <TelegramLink className={styles.panelTelegram}>{t('footer.telegram')}</TelegramLink>
            <div className={styles.panelFoot}>
              <div className={styles.panelControls}>
                <LocaleSwitcher
                  className={styles.locales}
                  itemClassName={styles.locale}
                  activeItemClassName={styles.locale}
                />
                <ThemeToggle className={styles.theme}>
                  <MoonIcon
                    size={18}
                    strokeWidth={1.6}
                  />
                </ThemeToggle>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
