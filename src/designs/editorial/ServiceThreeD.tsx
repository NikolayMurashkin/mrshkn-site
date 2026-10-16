import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { EditorialDashes } from './Dashes';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons';
import type { EditorialServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';

export const EditorialServiceThreeD = ({ data }: EditorialServiceThreeDProps) => {
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
        </div>
        <figure className={styles.figure}>
          <ServiceMedia
            posters={data.posters}
            video={data.video}
            classes={{ frame: styles.frame, poster: styles.poster, video: styles.video, play: styles.play }}
          />
          <figcaption className={styles.caption}>{t('mediaNote')}</figcaption>
        </figure>
        <a
          className={page.more}
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
          <p className={page.note}>{t('tiersNote')}</p>
        </div>
        <ul className={styles.tiers}>
          {data.tiers.map((tier) => (
            <li
              className={styles.tier}
              key={tier.id}
            >
              <a
                className={styles.tierCard}
                href={tier.href}
                aria-label={t('tierCta', { name: tier.name })}
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
          <p className={page.note}>{data.terms.note}</p>
        </div>
        <EditorialDashes items={data.terms.items} />
        <p className={styles.note}>
          {texts.rich('webgl', {
            link: (chunks) => (
              <a
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
          <p className={page.note}>{data.needs.note}</p>
        </div>
        <EditorialDashes items={data.needs.items} />
        <p className={styles.note}>{data.model}</p>
      </section>
    </>
  );
};
