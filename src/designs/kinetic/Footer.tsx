import { useTranslations } from 'next-intl';
import styles from './Footer.module.scss';

export const KineticFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <p className={styles.heading}>{t('heading')}</p>
      <div className={styles.aside}>
        <a
          className={styles.cta}
          href="#"
        >
          {t('telegram')}
        </a>
        <span className={styles.note}>{t('replyTime')}</span>
      </div>
    </footer>
  );
};
