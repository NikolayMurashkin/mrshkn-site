import { useTranslations } from 'next-intl';
import { Terms } from '@/components/Term';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { POP_STICKERS } from './consts';
import { ArrowRightIcon, StarIcon } from './icons';
import styles from './Hero.module.scss';
import { PopTermScope } from './TermScope';

const STICKER_CLASSES: Record<(typeof POP_STICKERS)[number], string> = {
  lighthouse: styles.stickerLighthouse,
  deadline: styles.stickerDeadline,
  warranty: styles.stickerWarranty,
};

export const PopHero = () => {
  const t = useTranslations('hero');

  return (
    <section className={styles.hero}>
      <PopTermScope>
        <div className={styles.content}>
          <h1 className={styles.title}>
            {t.rich('pop.title', {
              br: () => <br />,
              mark: (chunks) => <span className={styles.mark}>{chunks}</span>,
            })}
          </h1>
          <p className={styles.lead}>
            <Terms text={t('subtitle')} /> <Terms text={t('pop.lead')} />
          </p>
          <div className={styles.actions}>
            <Link
              className={`${styles.button} ${styles.primary}`}
              href={BRIEF_HREF}
            >
              {t('pop.primaryCta')}
              <ArrowRightIcon />
            </Link>
            <a
              className={styles.button}
              href="#process"
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
          <StarIcon className={styles.star} />
        </div>
      </PopTermScope>
    </section>
  );
};
