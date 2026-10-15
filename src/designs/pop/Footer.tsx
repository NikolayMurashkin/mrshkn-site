import { useTranslations } from 'next-intl';
import { TelegramLink } from '@/components/TelegramLink';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { POP_STUDIO_EMAIL } from './consts';
import { ArrowRightIcon } from './icons';
import styles from './Footer.module.scss';

export const PopFooter = () => {
  const t = useTranslations('footer');
  const brand = useTranslations('brand');

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.band}>
        <p className={styles.title}>{t('headingQuestion')}</p>
        <div className={styles.aside}>
          <div className={styles.actions}>
            <Link
              className={styles.cta}
              href={BRIEF_HREF}
            >
              {t('cta')}
              <ArrowRightIcon />
            </Link>
            <TelegramLink className={styles.telegram}>{t('telegram')}</TelegramLink>
          </div>
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
          <span translate="no">{brand('tagline')}</span>
          <span translate="no">{POP_STUDIO_EMAIL}</span>
          <Link
            className={styles.link}
            href={PRIVACY_HREF}
          >
            {t('privacy')}
          </Link>
        </div>
      </div>
    </footer>
  );
};
