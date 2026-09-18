import { useTranslations } from 'next-intl';
import styles from './Footer.module.scss';

export const EditorialFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <p className={styles.heading}>{t('invitation')}</p>
      <a
        className={styles.cta}
        href="#"
      >
        {t('telegram')}
      </a>
    </footer>
  );
};
