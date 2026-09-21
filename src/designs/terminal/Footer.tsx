import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import styles from './Footer.module.scss';

export const TerminalFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.lead}>
        <span className={styles.command}>
          <span className={styles.prompt}>$</span> {t('command')}
        </span>
        <p className={styles.heading}>{t('heading')}</p>
      </div>
      <div className={styles.aside}>
        <Link
          className={styles.cta}
          href={BRIEF_HREF}
        >
          {t('cta')} <span aria-hidden="true">→</span>
        </Link>
        <span className={styles.note}>
          <span aria-hidden="true">{'// '}</span>
          {t('replyTime')}
        </span>
      </div>
    </footer>
  );
};
