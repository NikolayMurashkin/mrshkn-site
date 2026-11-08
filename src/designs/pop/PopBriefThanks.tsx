import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { withEmailLinks } from '../email-links';
import { ArrowRightIcon, StarIcon } from './icons';
import styles from './PopBriefThanks.module.scss';

export const PopBriefThanks = () => {
  const t = useTranslations('briefThanks');

  return (
    <main
      className={styles.thanks}
      data-testid="brief-thanks"
    >
      <div className={styles.body}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('text')}</p>
        <p className={styles.note}>{withEmailLinks(t('note'))}</p>
        <Link
          className={styles.button}
          href="/"
        >
          {t('back')}
          <ArrowRightIcon />
        </Link>
      </div>
      <StarIcon
        className={styles.burst}
        size={260}
      />
    </main>
  );
};
