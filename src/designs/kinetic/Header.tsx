import { useLocale, useTranslations } from 'next-intl';
import { MoonIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NAV_ITEMS } from '../consts';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import styles from './Header.module.scss';

export const KineticHeader = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span
          className={styles.wordmark}
          data-testid="brand"
        >
          {t('brand.name')}
        </span>
        <span className={styles.tagline}>{t('brand.tagline')}</span>
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item}
            href={`/${locale}#${item}`}
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
          <MoonIcon size={22} />
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
