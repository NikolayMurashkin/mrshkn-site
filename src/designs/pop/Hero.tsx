import { useTranslations } from 'next-intl';
import { POP_STICKERS } from './consts';
import styles from './Hero.module.scss';

const STICKER_CLASSES: Record<(typeof POP_STICKERS)[number], string> = {
  lighthouse: styles.stickerLighthouse,
  deadline: styles.stickerDeadline,
  warranty: styles.stickerWarranty,
};

export const PopHero = () => {
  const t = useTranslations('hero');

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {t.rich('pop.title', {
            br: () => <br />,
            mark: (chunks) => <span className={styles.mark}>{chunks}</span>,
          })}
        </h1>
        <p className={styles.lead}>
          {t('subtitle')} {t('pop.lead')}
        </p>
        <div className={styles.actions}>
          <a
            className={`${styles.button} ${styles.buttonPrimary}`}
            href="#"
          >
            {t('pop.primaryCta')}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <a
            className={styles.button}
            href="#"
          >
            {t('pop.secondaryCta')}
          </a>
        </div>
      </div>
      <div className={styles.stickers}>
        {POP_STICKERS.map((sticker) => (
          <div
            key={sticker}
            className={`${styles.sticker} ${STICKER_CLASSES[sticker]}`}
          >
            {t.rich(`pop.stickers.${sticker}`, { br: () => <br /> })}
          </div>
        ))}
        <svg
          className={styles.star}
          width="70"
          height="70"
          viewBox="0 0 24 24"
          fill="var(--accent-alt)"
          stroke="var(--ink)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2l2.4 6.6L21 9.3l-5.2 4.3 1.7 6.9L12 16.9l-5.5 3.6 1.7-6.9L3 9.3l6.6-.7z" />
        </svg>
      </div>
    </section>
  );
};
