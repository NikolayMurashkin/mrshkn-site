import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { MoonIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { TelegramLink } from '@/components/TelegramLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link, usePathname } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { NAV_ITEMS } from '../consts';
import { navHref, visibleNavItems } from '../nav';
import type { HeaderProps } from '../types';
import { useActiveSection } from '../use-active-section';
import { useMobileMenu } from '../use-mobile-menu';
import { buttonClass } from './button';
import { KINETIC_HEADER_OFFSET, KINETIC_MENU_MAX_WIDTH } from './consts';
import { useScrolled } from './use-header';
import styles from './Header.module.scss';

export const KineticHeader = ({ hasCases }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const items = useMemo(() => visibleNavItems(NAV_ITEMS, hasCases), [hasCases]);
  const { sentinel, scrolled } = useScrolled();
  const active = useActiveSection(items, pathname === '/', KINETIC_HEADER_OFFSET);
  const menu = useMobileMenu(KINETIC_MENU_MAX_WIDTH);
  const headerClass = [styles.header, scrolled && styles.scrolled, menu.open && styles.open].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={styles.sentinel}
        ref={sentinel}
        aria-hidden="true"
      />
      <header className={headerClass}>
        <div className={styles.brand}>
          <Link
            className={styles.wordmark}
            href="/"
            data-testid="brand"
            translate="no"
          >
            {t('brand.name')}
          </Link>
          <span className={styles.tagline}>{t('brand.tagline')}</span>
        </div>
        <nav className={styles.nav}>
          {items.map((item) => (
            <a
              key={item}
              href={navHref(locale, item)}
              aria-current={active === item ? 'true' : undefined}
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
            <MoonIcon size={22} />
          </ThemeToggle>
          <Link
            className={`${buttonClass({ size: 'small' })} ${styles.cta}`}
            href={BRIEF_HREF}
          >
            {t('header.cta')}
          </Link>
          <button
            {...menu.burgerProps}
            className={styles.burger}
          >
            <span
              className={styles.burgerBar}
              aria-hidden="true"
            />
            <span
              className={styles.burgerBar}
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
                <ul className={styles.panelList}>
                  {items.map((item) => (
                    <li
                      key={item}
                      className={styles.panelItem}
                    >
                      <a
                        className={styles.panelLink}
                        href={navHref(locale, item)}
                        aria-current={active === item ? 'true' : undefined}
                        onClick={menu.onNavigate}
                      >
                        <span className={styles.panelMask}>
                          <span className={styles.panelWord}>{t(`nav.${item}`)}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className={styles.plate}>
                <div className={styles.plateControls}>
                  <LocaleSwitcher
                    className={styles.plateLocales}
                    itemClassName={styles.plateLocale}
                    activeItemClassName={`${styles.plateLocale} ${styles.plateLocaleActive}`}
                  />
                  <ThemeToggle className={`${styles.theme} ${styles.plateTheme}`}>
                    <MoonIcon size={22} />
                  </ThemeToggle>
                </div>
                <TelegramLink className={`${buttonClass({ size: 'large', onInk: true })} ${styles.plateTelegram}`}>
                  {t('footer.telegram')}
                </TelegramLink>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
};
