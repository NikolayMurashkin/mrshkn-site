import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { buttonClass } from './button';
import { KINETIC_FOUNDED_YEAR, KINETIC_STUDIO_EMAIL } from './consts';
import styles from './Footer.module.scss';

export const KineticFooter = () => {
  const t = useTranslations('footer');
  const brand = useTranslations('brand');

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.main}>
        <p className={styles.title}>{t('heading')}</p>
        <div className={styles.aside}>
          <Link
            className={buttonClass({ primary: true, size: 'large', onInk: true })}
            href={BRIEF_HREF}
          >
            {t('cta')}
          </Link>
          <span className={styles.note}>{t('replyTime')}</span>
        </div>
      </div>
      <div className={styles.bar}>
        <span
          className={styles.wordmark}
          translate="no"
        >
          {brand('name')}
        </span>
        <div className={styles.links}>
          <span>{KINETIC_STUDIO_EMAIL}</span>
          <Link
            className={styles.link}
            href={PRIVACY_HREF}
          >
            {t('privacy')}
          </Link>
          <span>© {KINETIC_FOUNDED_YEAR}</span>
        </div>
      </div>
    </footer>
  );
};
