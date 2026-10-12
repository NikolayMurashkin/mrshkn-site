import { useTranslations } from 'next-intl';
import { useCookieBanner } from '@/components/Analytics/use-consent';
import { Link } from '@/i18n/navigation';
import { PRIVACY_HREF } from '@/lib/consts';
import styles from './CookieBanner.module.scss';

export const EditorialCookieBanner = () => {
  const t = useTranslations('cookieBanner');
  const { visible, ref, accept, decline } = useCookieBanner();

  if (!visible) {
    return null;
  }

  return (
    <section
      ref={ref}
      className={styles.banner}
      aria-label={t('label')}
      data-testid="cookie-banner"
    >
      <p className={styles.text}>
        {t.rich('text', {
          policy: (chunks) => (
            <Link
              className={styles.link}
              href={PRIVACY_HREF}
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          onClick={accept}
        >
          {t('accept')}
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={decline}
        >
          {t('decline')}
        </button>
      </div>
    </section>
  );
};
