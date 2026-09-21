import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import styles from './Footer.module.scss';

export const PopFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.band}>
        <p className={styles.heading}>{t('headingQuestion')}</p>
        <div className={styles.aside}>
          <Link
            className={styles.cta}
            href={BRIEF_HREF}
          >
            {t('cta')}
          </Link>
          <span className={styles.note}>{t('replyTime')}</span>
        </div>
      </div>
    </footer>
  );
};
