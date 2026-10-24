import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { ArrowUpRightIcon } from './icons';
import { buttonClass } from './button';
import { KineticServiceTiers } from './ServiceTiers';
import type { KineticServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';

export const KineticServiceThreeD = ({ data, tiers }: KineticServiceThreeDProps) => {
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

      {tiers ? <KineticServiceTiers data={tiers} /> : null}

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
