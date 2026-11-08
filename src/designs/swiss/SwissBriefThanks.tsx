import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_STEPS } from '@/lib/brief/consts';
import { withEmailLinks } from '../email-links';
import { ArrowRightIcon } from './icons';
import { padCount } from './utils';
import styles from './SwissBriefThanks.module.scss';

export const SwissBriefThanks = () => {
  const t = useTranslations('briefThanks');

  return (
    <main
      className={styles.thanks}
      data-testid="brief-thanks"
    >
      <div className={styles.aside}>
        <ol
          className={styles.progress}
          aria-hidden="true"
        >
          {BRIEF_STEPS.map((name) => (
            <li
              key={name}
              data-state="done"
            />
          ))}
        </ol>
        <span
          className={styles.count}
          aria-hidden="true"
        >
          {padCount(BRIEF_STEPS.length)}
          <small>/{padCount(BRIEF_STEPS.length)}</small>
        </span>
      </div>
      <div className={styles.main}>
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
    </main>
  );
};
