import { ArrowUpRightIcon } from './icons';
import page from './ServicePage.module.scss';
import styles from './ServiceTiers.module.scss';
import type { PopServiceTiersProps } from './types';

export const PopServiceTiers = ({ data }: PopServiceTiersProps) => (
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
      {data.items.map((tier) => (
        <li
          className={styles.tier}
          key={tier.id}
        >
          <a
            className={styles.tierCard}
            href={tier.href}
            aria-label={tier.cta}
          >
            <span className={styles.tierTerm}>{tier.term}</span>
            <span className={styles.tierName}>{tier.name}</span>
            <span className={styles.tierText}>{tier.summary}</span>
            <span className={styles.tierFoot}>
              <span className={styles.tierAmount}>{tier.price}</span>
              <span
                className={styles.round}
                aria-hidden="true"
              >
                <ArrowUpRightIcon />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  </section>
);
