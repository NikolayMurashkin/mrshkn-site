import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './TerminalBriefThanks.module.scss';

export const TerminalBriefThanks = () => {
  const t = useTranslations('briefThanks');

  return (
    <main
      className={styles.thanks}
      data-testid="brief-thanks"
    >
      <div className={styles.window}>
        <div
          className={styles.bar}
          aria-hidden="true"
        >
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <div className={styles.body}>
          <p
            className={styles.prompt}
            translate="no"
          >
            <span className={styles.sign}>$</span> {t('command')}
          </p>
          <p
            className={styles.status}
            translate="no"
          >
            [ok]
          </p>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.text}>{t('text')}</p>
          <p className={styles.note}>
            <span
              className={styles.mark}
              aria-hidden="true"
            >
              {'//'}
            </span>{' '}
            {t('note')}
          </p>
          <Link
            className={styles.button}
            href="/"
          >
            {t('back')}
          </Link>
        </div>
      </div>
    </main>
  );
};
