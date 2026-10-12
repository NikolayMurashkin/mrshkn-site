import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { EDITORIAL_STUDIO_EMAIL } from './consts';
import styles from './Footer.module.scss';

export const EditorialFooter = () => {
  const t = useTranslations();

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.main}>
        <p className={styles.title}>{t('footer.invitation')}</p>
        <div className={styles.actions}>
          <Link
            className={styles.cta}
            href={BRIEF_HREF}
          >
            {t('footer.cta')}
          </Link>
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
        <Link
          className={styles.privacy}
          href={PRIVACY_HREF}
        >
          {t('footer.privacy')}
        </Link>
        <span
          className={styles.email}
          translate="no"
        >
          {EDITORIAL_STUDIO_EMAIL}
        </span>
      </div>
    </footer>
  );
};
