import { useTranslations } from 'next-intl';
import { PhoneLink } from '@/components/PhoneLink';
import { TelegramLink } from '@/components/TelegramLink';
import { useLegalLinks } from '@/components/use-legal-links';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { buttonClass } from './button';
import { KINETIC_FOUNDED_YEAR, KINETIC_STUDIO_EMAIL } from './consts';
import styles from './Footer.module.scss';

export const KineticFooter = () => {
  const t = useTranslations('footer');
  const legalLinks = useLegalLinks();
  const brand = useTranslations('brand');

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <div className={styles.main}>
        <p className={styles.title}>{t('heading')}</p>
        <div className={styles.aside}>
          <div className={styles.actions}>
            <Link
              className={buttonClass({ primary: true, size: 'large', onInk: true })}
              href={BRIEF_HREF}
            >
              {t('cta')}
            </Link>
            <TelegramLink className={buttonClass({ size: 'large', onInk: true })}>{t('telegram')}</TelegramLink>
          </div>
          <PhoneLink />
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
          <a
            className={styles.link}
            href={`mailto:${KINETIC_STUDIO_EMAIL}`}
          >
            {KINETIC_STUDIO_EMAIL}
          </a>
          <Link
            className={styles.link}
            href={PRIVACY_HREF}
          >
            {t('privacy')}
          </Link>
          {legalLinks.map(({ href, label }) => (
            <Link
              key={href}
              className={styles.link}
              href={href}
            >
              {label}
            </Link>
          ))}
          <span>© {KINETIC_FOUNDED_YEAR}</span>
        </div>
      </div>
    </footer>
  );
};
