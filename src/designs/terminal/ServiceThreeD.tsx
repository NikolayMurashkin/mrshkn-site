import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { TerminalChecks } from './Checks';
import { TerminalServiceTiers } from './ServiceTiers';
import type { TerminalServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';

export const TerminalServiceThreeD = ({ data, tiers }: TerminalServiceThreeDProps) => {
  const t = useTranslations('servicePage.threeD');
  const texts = useTranslations('services.threeD');
  const demoAddress = data.demoHref.replace(/^https:\/\//, '');

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
        <div className={styles.window}>
          <div
            className={styles.bar}
            aria-hidden="true"
          >
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span
              className={styles.address}
              translate="no"
            >
              {demoAddress}
            </span>
          </div>
          <ServiceMedia
            posters={data.posters}
            video={data.video}
            classes={{ frame: styles.frame, poster: styles.poster, video: styles.video, play: styles.play }}
          />
        </div>
        <a
          className={page.more}
          href={data.demoHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('demo')}
        </a>
      </section>

      {tiers ? <TerminalServiceTiers data={tiers} /> : null}

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
        <TerminalChecks items={data.terms.items} />
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
        <TerminalChecks items={data.needs.items} />
        <p className={styles.note}>{data.model}</p>
      </section>
    </>
  );
};
