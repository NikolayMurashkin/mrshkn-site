import { useTranslations } from 'next-intl';
import { TelegramLink } from '@/components/TelegramLink';
import { Terms } from '@/components/Term';
import { useLegalLinks } from '@/components/use-legal-links';
import { Link, usePathname } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { PRIVACY_HREF } from '@/lib/consts';
import { SWISS_STUDIO_EMAIL } from './consts';
import { ArrowRightIcon } from './icons';
import styles from './Footer.module.scss';
import { SwissTermScope } from './TermScope';

export const SwissFooter = () => {
  const t = useTranslations('footer');
  const legalLinks = useLegalLinks();
  const brand = useTranslations('brand');
  const onHome = usePathname() === '/';

  return (
    <footer
      className={styles.footer}
      id="contacts"
    >
      <SwissTermScope>
        <div className={styles.band}>
          <div className={styles.aside}>
            {onHome ? (
              <span
                className={styles.index}
                aria-hidden="true"
              />
            ) : null}
            <span className={styles.mark}>
              <Terms text={t('sectionMark')} />
            </span>
          </div>
          <div className={styles.main}>
            <p className={styles.title}>
              <Terms text={t('headingQuestion')} />
            </p>
            <p className={styles.lead}>
              <Terms text={t('invitation')} />
            </p>
            <div className={styles.actions}>
              <div className={styles.buttons}>
                <Link
                  className={styles.cta}
                  href={BRIEF_HREF}
                >
                  {t('cta')}
                  <ArrowRightIcon />
                </Link>
                <TelegramLink className={styles.telegram}>{t('telegram')}</TelegramLink>
              </div>
              <span className={styles.note}>
                <Terms text={t('replyTime')} />
              </span>
            </div>
          </div>
        </div>
        <div className={styles.bar}>
          <span
            className={styles.wordmark}
            translate="no"
          >
            {brand('name')}
          </span>
          <span
            className={styles.tagline}
            translate="no"
          >
            <Terms text={brand('tagline')} />
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
          <span
            className={styles.email}
            translate="no"
          >
            {SWISS_STUDIO_EMAIL}
          </span>
        </div>
      </SwissTermScope>
    </footer>
  );
};
