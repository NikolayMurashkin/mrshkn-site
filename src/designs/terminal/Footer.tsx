import { useTranslations } from 'next-intl';
import { PhoneLink } from '@/components/PhoneLink';
import { TelegramLink } from '@/components/TelegramLink';
import { useLegalLinks } from '@/components/use-legal-links';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import styles from './Footer.module.scss';

export const TerminalFooter = () => {
  const t = useTranslations('footer');
  const legalLinks = useLegalLinks();

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
        <PhoneLink />
        <span className={styles.note}>
          <span aria-hidden="true">{'// '}</span>
          {t('replyTime')}
        </span>
        <div className={styles.documents}>
          <Link
            className={styles.privacy}
            href={PRIVACY_HREF}
          >
            {t('privacy')}
          </Link>
          {legalLinks.map(({ href, label }) => (
            <Link
              key={href}
              className={styles.privacy}
              href={href}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};
