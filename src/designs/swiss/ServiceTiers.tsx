import { ArrowRightIcon } from './icons';
import page from './ServicePage.module.scss';
import styles from './ServiceTiers.module.scss';
import type { SwissServiceTiersProps } from './types';

export const SwissServiceTiers = ({ data }: SwissServiceTiersProps) => (
  <section
    className={page.block}
    aria-labelledby="service-tiers"
  >
    <div className={page.blockHead}>
      <h2
        className={page.blockTitle}
        id="service-tiers"
      >
        {data.heading}
      </h2>
      <p className={page.blockNote}>{data.note}</p>
    </div>
    <ul className={styles.tiers}>
      {data.items.map((tier, index) => (
        <li
          className={styles.tier}
          key={tier.id}
        >
          <a
            className={styles.tierCard}
            href={tier.href}
            aria-label={tier.cta}
          >
            <span className={styles.tierTop}>
              <span className={styles.tierIndex}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.tierTerm}>{tier.term}</span>
            </span>
            <span className={styles.tierName}>{tier.name}</span>
            <span className={styles.tierText}>{tier.summary}</span>
            <span className={styles.tierFoot}>
              <span className={styles.tierAmount}>{tier.price}</span>
              <span
                className={styles.arrow}
                aria-hidden="true"
              >
                <ArrowRightIcon />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  </section>
);
