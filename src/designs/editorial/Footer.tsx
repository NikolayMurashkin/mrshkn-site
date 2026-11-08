import { useTranslations } from 'next-intl';
import { TelegramLink } from '@/components/TelegramLink';
import { useLegalLinks } from '@/components/use-legal-links';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { EDITORIAL_STUDIO_EMAIL } from './consts';
import styles from './Footer.module.scss';

export const EditorialFooter = () => {
  const t = useTranslations();
  const legalLinks = useLegalLinks();

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.main}>
        <p className={styles.title}>{t('footer.invitation')}</p>
        <div className={styles.actions}>
          <div className={styles.buttons}>
            <Link
              className={styles.cta}
              href={BRIEF_HREF}
            >
              {t('footer.cta')}
            </Link>
            <TelegramLink className={styles.telegram}>{t('footer.telegram')}</TelegramLink>
          </div>
          <span className={styles.note}>{t('footer.replyTime')}</span>
        </div>
      </div>
      <div className={styles.colophon}>
        <span
          className={styles.mark}
          translate="no"
        >
          {t('brand.name')}
        </span>
        <span>
          <span translate="no">{t('brand.tagline')}</span> · {t('header.founded')}
        </span>
        <span>{t('header.location')}</span>
        <div className={styles.documents}>
          <Link
            className={styles.privacy}
            href={PRIVACY_HREF}
          >
            {t('footer.privacy')}
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
        <a
          className={styles.email}
          href={`mailto:${EDITORIAL_STUDIO_EMAIL}`}
          translate="no"
        >
          {EDITORIAL_STUDIO_EMAIL}
        </a>
      </div>
    </footer>
  );
};
