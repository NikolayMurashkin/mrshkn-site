import { useLocale, useTranslations } from 'next-intl';
import { MoonIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { NAV_ITEMS } from '../consts';
import { visibleNavItems } from '../nav';
import type { HeaderProps } from '../types';
import { buttonClass } from './button';
import { useActiveSection, useScrolled } from './use-header';
import styles from './Header.module.scss';

export const KineticHeader = ({ hasCases }: HeaderProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const items = visibleNavItems(NAV_ITEMS, hasCases);
  const { sentinel, scrolled } = useScrolled();
  const active = useActiveSection(items);

  return (
    <>
      <div
        className={styles.sentinel}
        ref={sentinel}
        aria-hidden="true"
      />
      <header className={scrolled ? `${styles.header} ${styles.scrolled}` : styles.header}>
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
              href={`/${locale}#${item}`}
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
        </div>
      </header>
    </>
  );
};
