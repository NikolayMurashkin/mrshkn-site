import { ArrowRightIcon } from './icons';
import page from './ServicePage.module.scss';
import styles from './ServiceTiers.module.scss';
import type { EditorialServiceTiersProps } from './types';

export const EditorialServiceTiers = ({ data }: EditorialServiceTiersProps) => (
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
      <p className={page.note}>{data.note}</p>
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
