import { useTranslations } from 'next-intl';
import styles from './Footer.module.scss';

export const SwissFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <span className={styles.mark}>{t('sectionMark')}</span>
      <p className={styles.heading}>{t('invitation')}</p>
      <div className={styles.aside}>
        <a
          className={styles.cta}
          href="#"
        >
          {t('telegram')}
        </a>
      </div>
    </footer>
  );
};
