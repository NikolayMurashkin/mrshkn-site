import { useTranslations } from 'next-intl';
import { Terms } from '@/components/Term';
import { Link } from '@/i18n/navigation';
import { BRIEF_HREF } from '@/lib/brief/consts';
import { buttonClass } from './button';
import {
  KINETIC_BADGE_CENTER,
  KINETIC_BADGE_RING_LENGTH,
  KINETIC_BADGE_RING_RADIUS,
  KINETIC_BADGE_SIZE,
  KINETIC_TAPE_PROMISES,
  KINETIC_TAPE_REPEAT,
  KINETIC_TICKER_ITEMS,
} from './consts';
import { ArrowRightIcon } from './icons';
import styles from './Hero.module.scss';
import { KineticTermScope } from './TermScope';

const repeated = <TItem,>(items: readonly TItem[]) => Array.from({ length: KINETIC_TAPE_REPEAT }, () => items).flat();

export const KineticHero = () => {
  const t = useTranslations('hero');
  const root = useTranslations();

  const works = repeated(KINETIC_TICKER_ITEMS).map((item) => t(`kinetic.ticker.${item}`));
  const promises = repeated(KINETIC_TAPE_PROMISES).map((key) => root(key));

  return (
    <section className={styles.hero}>
      <KineticTermScope>
        <div className={styles.grid}>
          <h1 className={styles.title}>
            {t.rich('kinetic.title', {
              line: (chunks) => (
                <span className={styles.line}>
                  <span>{chunks}</span>
                </span>
              ),
              accent: (chunks) => <span className={styles.mark}>{chunks}</span>,
            })}
          </h1>
          <div className={styles.content}>
            <div className={styles.subtitles}>
              <p className={styles.lead}>
                <Terms text={t('subtitle')} />
              </p>
              <p className={styles.lead}>
                <Terms text={t('kinetic.lead')} />
              </p>
            </div>
            <div className={styles.actions}>
              <Link
                className={buttonClass({ primary: true })}
                href={BRIEF_HREF}
              >
                {t('kinetic.primaryCta')}
                <ArrowRightIcon />
              </Link>
              <a
                className={buttonClass()}
                href="#process"
              >
                {t('kinetic.secondaryCta')}
              </a>
            </div>
          </div>
          <div className={styles.badge}>
            <svg
              className={styles.spin}
              width={KINETIC_BADGE_SIZE}
              height={KINETIC_BADGE_SIZE}
              viewBox={`0 0 ${KINETIC_BADGE_SIZE} ${KINETIC_BADGE_SIZE}`}
              aria-hidden="true"
            >
              <defs>
                <path
                  id="kinetic-hero-ring"
                  d={`M${KINETIC_BADGE_CENTER},${KINETIC_BADGE_CENTER} m-${KINETIC_BADGE_RING_RADIUS},0 a${KINETIC_BADGE_RING_RADIUS},${KINETIC_BADGE_RING_RADIUS} 0 1,1 ${2 * KINETIC_BADGE_RING_RADIUS},0 a${KINETIC_BADGE_RING_RADIUS},${KINETIC_BADGE_RING_RADIUS} 0 1,1 -${2 * KINETIC_BADGE_RING_RADIUS},0`}
                />
              </defs>
              <text className={styles.badgeText}>
                <textPath
                  href="#kinetic-hero-ring"
                  textLength={KINETIC_BADGE_RING_LENGTH}
                  lengthAdjust="spacing"
                >
                  {t('kinetic.badge')}
                </textPath>
              </text>
            </svg>
            <svg
              className={styles.center}
              width={KINETIC_BADGE_SIZE}
              height={KINETIC_BADGE_SIZE}
              viewBox={`0 0 ${KINETIC_BADGE_SIZE} ${KINETIC_BADGE_SIZE}`}
              aria-hidden="true"
            >
              <circle
                className={styles.disc}
                cx={KINETIC_BADGE_CENTER}
                cy={KINETIC_BADGE_CENTER}
                r="44"
              />
              <path
                className={styles.arrow}
                d="M116 144L144 116M121 116h23v23"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div
          className={styles.tapes}
          aria-hidden="true"
        >
          <div className={`${styles.tape} ${styles.tapeInk}`}>
            <div className={styles.track}>
              {promises.map((text, index) => (
                <span
                  className={styles.item}
                  key={index}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
          <div className={`${styles.tape} ${styles.tapeAccent}`}>
            <div className={styles.track}>
              {works.map((text, index) => (
                <span
                  className={styles.item}
                  key={index}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </KineticTermScope>
    </section>
  );
};
