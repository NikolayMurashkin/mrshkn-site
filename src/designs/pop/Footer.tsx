import { useTranslations } from 'next-intl';
import styles from './Footer.module.scss';

export const PopFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.band}>
        <p className={styles.heading}>{t('headingQuestion')}</p>
        <div className={styles.aside}>
          <a
            className={styles.cta}
            href="#"
          >
            {t('telegram')}
          </a>
          <span className={styles.note}>{t('replyTime')}</span>
        </div>
      </div>
    </footer>
  );
};
