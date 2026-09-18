import { useTranslations } from 'next-intl';
import styles from './Hero.module.scss';

export const KineticHero = () => {
  const t = useTranslations('hero');

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {t.rich('title', {
            br: () => <br />,
            accent: (chunks) => <span className={styles.accent}>{chunks}</span>,
          })}
        </h1>
        <div className={styles.lead}>
          <div className={styles.subtitles}>
            <p className={styles.subtitle}>{t('subtitle')}</p>
            <p className={styles.subtitle}>{t('subtitleSecondary')}</p>
          </div>
          <div className={styles.actions}>
            <a
              className={`${styles.button} ${styles.buttonPrimary}`}
              href="#"
            >
              {t('primaryCta')}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              className={styles.button}
              href="#"
            >
              {t('secondaryCta')}
            </a>
          </div>
        </div>
      </div>
      <div className={styles.badge}>
        <svg
          className={styles.spin}
          width="220"
          height="220"
          viewBox="0 0 220 220"
          aria-hidden="true"
        >
          <defs>
            <path
              id="kinetic-hero-ring"
              d="M110,110 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0"
            />
          </defs>
          <circle
            cx="110"
            cy="110"
            r="34"
            fill="var(--accent)"
          />
          <text className={styles.badgeText}>
            <textPath href="#kinetic-hero-ring">{t('badge')}</textPath>
          </text>
        </svg>
      </div>
    </section>
  );
};
