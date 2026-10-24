import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { SWISS_GUIDES } from './consts';
import { ArrowRightIcon } from './icons';
import styles from './Hero.module.scss';

export const SwissHero = () => {
  const t = useTranslations('hero');
  const header = useTranslations('header');

  return (
    <section className={styles.hero}>
      <div
        className={styles.guides}
        aria-hidden="true"
      >
        {SWISS_GUIDES.map((guide) => (
          <span key={guide} />
        ))}
      </div>
      <div className={styles.aside}>
        <span
          className={styles.index}
          aria-hidden="true"
        />
        <span className={styles.mark}>{t('swiss.sectionMark')}</span>
        <span className={styles.location}>{header('location')}</span>
        <span className={styles.fact}>{header('kicker')}</span>
        <span className={styles.fact}>{header('founded')}</span>
      </div>
      <div className={styles.main}>
        <h1 className={styles.title}>
          {t.rich('swiss.title', {
            dot: (chunks) => <span className={styles.dot}>{chunks}</span>,
          })}
        </h1>
        <div className={styles.row}>
          <p className={styles.lead}>{t('subtitle')}</p>
          <div className={styles.actions}>
            <Link
              className={`${styles.button} ${styles.primary}`}
              href={BRIEF_HREF}
            >
              {t('swiss.primaryCta')}
              <ArrowRightIcon />
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
      <span
        className={styles.rule}
        aria-hidden="true"
      />
    </section>
  );
};
