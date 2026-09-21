import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import styles from './Footer.module.scss';

export const EditorialFooter = () => {
  const t = useTranslations('footer');

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <p className={styles.heading}>{t('invitation')}</p>
      <Link
        className={styles.cta}
        href={BRIEF_HREF}
      >
        {t('cta')}
      </Link>
    </footer>
  );
};
