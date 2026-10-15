import { useTranslations } from 'next-intl';
import { TelegramLink } from '@/components/TelegramLink';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import styles from './Footer.module.scss';

export const TerminalFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.lead}>
        <span
          className={styles.command}
          translate="no"
        >
          <span className={styles.prompt}>$</span> {t('command')}
        </span>
        <p className={styles.heading}>{t('heading')}</p>
      </div>
      <div className={styles.aside}>
        <div className={styles.actions}>
          <Link
            className={styles.cta}
            href={BRIEF_HREF}
          >
            {t('cta')} <span aria-hidden="true">→</span>
          </Link>
          <TelegramLink className={styles.telegram}>
            {t('telegram')} <span aria-hidden="true">→</span>
          </TelegramLink>
        </div>
        <span className={styles.note}>
          <span aria-hidden="true">{'// '}</span>
          {t('replyTime')}
        </span>
        <Link
          className={styles.privacy}
          href={PRIVACY_HREF}
        >
          {t('privacy')}
        </Link>
      </div>
    </footer>
  );
};
