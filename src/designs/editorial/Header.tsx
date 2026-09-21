import { useLocale, useTranslations } from 'next-intl';
import { MoonIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EDITORIAL_NAV_ITEMS } from './consts';
import styles from './Header.module.scss';

export const EditorialHeader = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <header className={styles.header}>
      <div className={styles.masthead}>
        <div className={styles.caps}>
          <span className={styles.kicker}>{t('header.kicker')}</span>
          <span className={styles.location}>{t('header.location')}</span>
          <div className={styles.controls}>
            <LocaleSwitcher
              className={styles.locales}
              itemClassName={styles.locale}
              activeItemClassName={styles.localeActive}
            />
            <ThemeToggle className={styles.theme}>
              <MoonIcon size={18} />
            </ThemeToggle>
          </div>
        </div>
        <span
          className={styles.wordmark}
          data-testid="brand"
        >
          {t('brand.name')}
        </span>
        <span className={styles.tagline}>
          {t('brand.tagline')} · {t('header.founded')}
        </span>
      </div>
      <nav className={styles.nav}>
        {EDITORIAL_NAV_ITEMS.map((item) => (
          <a
            key={item}
            href={`/${locale}#${item}`}
          >
            {t(`nav.${item}`)}
          </a>
        ))}
      </nav>
    </header>
  );
};
