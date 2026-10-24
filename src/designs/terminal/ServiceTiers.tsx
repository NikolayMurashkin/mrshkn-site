import { TerminalChecks } from './Checks';
import page from './ServicePage.module.scss';
import styles from './ServiceTiers.module.scss';
import type { TerminalServiceTiersProps } from './types';

export const TerminalServiceTiers = ({ data }: TerminalServiceTiersProps) => (
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
          <div className={styles.tierHead}>
            {tier.kind ? <p className={page.label}>{tier.kind}</p> : null}
            <h3 className={styles.tierName}>{tier.name}</h3>
            <p className={styles.tierText}>{tier.summary}</p>
          </div>
          <div className={styles.tierPrice}>
            <span className={styles.tierAmount}>{tier.price}</span>
            <span className={styles.tierTerm}>{tier.term}</span>
          </div>
          {tier.points.length > 0 ? <TerminalChecks items={tier.points} /> : null}
          <a
            className={styles.tierCta}
            href={tier.href}
          >
            {tier.cta}
          </a>
        </li>
      ))}
    </ul>
  </section>
);
