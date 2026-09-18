import { useTranslations } from 'next-intl';
import styles from './Footer.module.scss';

export const TerminalFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.lead}>
        <span className={styles.command}>
          <span className={styles.prompt}>$</span> {t('command')}
        </span>
        <p className={styles.heading}>{t('heading')}</p>
      </div>
      <div className={styles.aside}>
        <a
          className={styles.cta}
          href="#"
        >
          {t('telegram')} <span aria-hidden="true">→</span>
        </a>
        <span className={styles.note}>
          <span aria-hidden="true">{'// '}</span>
          {t('replyTime')}
        </span>
      </div>
    </footer>
  );
};
