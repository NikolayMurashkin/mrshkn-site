import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
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
            <Link
              className={`${styles.button} ${styles.buttonPrimary}`}
              href={BRIEF_HREF}
            >
              {t('swiss.primaryCta')}
            </Link>
            <a
              className={styles.button}
              href="#process"
            >
              {t('swiss.secondaryCta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
