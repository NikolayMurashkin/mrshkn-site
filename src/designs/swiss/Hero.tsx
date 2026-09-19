import { useTranslations } from 'next-intl';
import styles from './Hero.module.scss';

export const SwissHero = () => {
  const t = useTranslations('hero');
  const header = useTranslations('header');

  return (
    <section className={styles.hero}>
      <div className={styles.meta}>
        <span>{t('swiss.sectionMark')}</span>
        <span className={styles.location}>{header('location')}</span>
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('swiss.title')}</h1>
        <div className={styles.row}>
          <p className={styles.lead}>
            {t('subtitle')} {t('swiss.lead')}
          </p>
          <div className={styles.actions}>
            <a
              className={`${styles.button} ${styles.buttonPrimary}`}
              href="#"
            >
              {t('swiss.primaryCta')}
            </a>
            <a
              className={styles.button}
              href="#"
            >
              {t('swiss.secondaryCta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
