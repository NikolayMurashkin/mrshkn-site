import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons';
import { buttonClass } from './button';
import type { KineticServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';

export const KineticServiceThreeD = ({ data }: KineticServiceThreeDProps) => {
  const t = useTranslations('servicePage.threeD');
  const texts = useTranslations('services.threeD');

  return (
    <>
      <section
        className={page.block}
        aria-labelledby="service-media"
      >
        <div className={page.blockHead}>
          <h2
            className={page.blockTitle}
            id="service-media"
          >
            {t('mediaHeading')}
          </h2>
          <p className={page.blockNote}>{t('mediaNote')}</p>
        </div>
        <ServiceMedia
          posters={data.posters}
          video={data.video}
          classes={{
            frame: styles.frame,
            poster: styles.poster,
            video: styles.video,
            play: `${buttonClass({ primary: true })} ${styles.play}`,
          }}
        />
        <a
          className={`${styles.link} ${styles.demo}`}
          href={data.demoHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('demo')}
          <ArrowUpRightIcon />
        </a>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-tiers"
      >
        <div className={page.blockHead}>
          <h2
            className={page.blockTitle}
            id="service-tiers"
          >
            {t('tiersHeading')}
          </h2>
          <p className={page.blockNote}>{t('tiersNote')}</p>
        </div>
        <ul className={styles.tiers}>
          {data.tiers.map((tier) => (
            <li
              className={styles.tier}
              key={tier.id}
            >
              <div className={styles.tierHead}>
                <p className={page.kicker}>{tier.kind}</p>
                <h3 className={styles.tierName}>{tier.name}</h3>
                <p className={styles.tierText}>{tier.summary}</p>
              </div>
              <div className={styles.tierPrice}>
                <span className={styles.tierAmount}>{tier.price}</span>
                <span className={styles.tierTerm}>{tier.term}</span>
              </div>
              <ul className={page.checks}>
                {tier.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <a
                className={`${buttonClass()} ${styles.tierCta}`}
                href={tier.href}
              >
                {t('tierCta', { name: tier.name })}
                <ArrowRightIcon />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-terms"
      >
        <div className={page.blockHead}>
          <h2
            className={page.blockTitle}
            id="service-terms"
          >
            {t('termsHeading')}
          </h2>
          <p className={page.blockNote}>{data.terms.note}</p>
        </div>
        <ul className={`${page.checks} ${page.ownBasics}`}>
          {data.terms.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.note}>
          {texts.rich('webgl', {
            link: (chunks) => (
              <a
                className={styles.link}
                href={data.webglSource}
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-needs"
      >
        <div className={page.blockHead}>
          <h2
            className={page.blockTitle}
            id="service-needs"
          >
            {t('needsHeading')}
          </h2>
          <p className={page.blockNote}>{data.needs.note}</p>
        </div>
        <ul className={`${page.checks} ${page.ownBasics}`}>
          {data.needs.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.note}>{data.model}</p>
      </section>
    </>
  );
};
