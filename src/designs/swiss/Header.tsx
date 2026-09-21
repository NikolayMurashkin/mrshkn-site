import { useLocale, useTranslations } from 'next-intl';
import { SunIcon } from '@/components/icons';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NAV_ITEMS } from '../consts';
import styles from './Header.module.scss';

export const SwissHeader = () => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <header className={styles.header}>
      <span
        className={styles.wordmark}
        data-testid="brand"
      >
        {t('brand.name')}
      </span>
      <span className={styles.tagline}>{t('brand.tagline')}</span>
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
          <SunIcon size={20} />
        </ThemeToggle>
      </div>
    </header>
  );
};
