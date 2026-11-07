import { Terms } from '@/components/Term';
import { buttonClass } from './button';
import { ArrowRightIcon } from './icons';
import page from './ServicePage.module.scss';
import styles from './ServiceTiers.module.scss';
import type { KineticServiceTiersProps } from './types';
import { KineticTermScope } from './TermScope';

export const KineticServiceTiers = ({ data }: KineticServiceTiersProps) => (
  <section
    className={page.block}
    aria-labelledby="service-tiers"
  >
    <KineticTermScope>
      <div className={page.blockHead}>
        <h2
          className={page.blockTitle}
          id="service-tiers"
        >
          {data.heading}
        </h2>
        <p className={page.blockNote}>
          <Terms text={data.note} />
        </p>
      </div>
      <ul className={styles.tiers}>
        {data.items.map((tier) => (
          <li
            className={styles.tier}
            key={tier.id}
          >
            <div className={styles.tierHead}>
              {tier.kind ? (
                <p className={page.kicker}>
                  <Terms text={tier.kind} />
                </p>
              ) : null}
              <h3 className={styles.tierName}>{tier.name}</h3>
              <p className={styles.tierText}>
                <Terms text={tier.summary} />
              </p>
            </div>
            <div className={styles.tierPrice}>
              <span className={styles.tierAmount}>
                <Terms text={tier.price} />
              </span>
              <span className={styles.tierTerm}>
                <Terms text={tier.term} />
              </span>
            </div>
            {tier.points.length > 0 ? (
              <ul className={page.checks}>
                {tier.points.map((point) => (
                  <li key={point}>
                    <Terms text={point} />
                  </li>
                ))}
              </ul>
            ) : null}
            <a
              className={`${buttonClass()} ${styles.tierCta}`}
              href={tier.href}
            >
              {tier.cta}
              <ArrowRightIcon />
            </a>
          </li>
        ))}
      </ul>
    </KineticTermScope>
  </section>
);
