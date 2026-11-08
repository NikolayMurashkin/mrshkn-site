import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { withEmailLinks } from '../email-links';
import { buttonClass } from './button';
import { ArrowRightIcon } from './icons';
import styles from './KineticBriefThanks.module.scss';

export const KineticBriefThanks = () => {
  const t = useTranslations('briefThanks');
  const brief = useTranslations('brief');

  return (
    <main
      className={styles.thanks}
      data-testid="brief-thanks"
    >
      <p className={styles.kicker}>{brief('title')}</p>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.text}>{t('text')}</p>
      <p className={styles.note}>{withEmailLinks(t('note'))}</p>
      <Link
        className={buttonClass({ primary: true })}
        href="/"
      >
        {t('back')}
        <ArrowRightIcon />
      </Link>
    </main>
  );
};
