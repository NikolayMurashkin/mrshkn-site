import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import styles from './SiteControls.module.scss';

// Временная шапка скелета: в блоке каркаса направлений ее заменяет Header своего направления.
export const SiteControls = () => {
  const t = useTranslations('brand');

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.wordmark}>{t('name')}</span>
        <span className={styles.tagline}>{t('tagline')}</span>
      </div>
      <div className={styles.controls}>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
};
