import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import styles from './Hero.module.scss';

export const EditorialHero = () => {
  const t = useTranslations('hero');

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('editorial.title')}</h1>
        <p className={styles.lead}>
          {t('subtitle')} {t('editorial.lead')}
        </p>
        <div className={styles.actions}>
          <Link
            className={`${styles.button} ${styles.buttonPrimary}`}
            href={BRIEF_HREF}
          >
            {t('editorial.primaryCta')}
          </Link>
          <a
            className={styles.button}
            href="#process"
          >
            {t('editorial.secondaryCta')}
          </a>
        </div>
      </div>
      <aside className={styles.aside}>
        <span className={styles.caps}>{t('editorial.quoteKicker')}</span>
        <blockquote className={styles.quote}>{t('editorial.quote')}</blockquote>
        <div className={styles.refs}>
          <span>{t('editorial.refDeadline')}</span>
          <span>{t('editorial.refQuality')}</span>
          <span>{t('editorial.refWarranty')}</span>
        </div>
      </aside>
    </section>
  );
};
