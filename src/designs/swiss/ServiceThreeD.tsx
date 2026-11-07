import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { richTerms, Terms } from '@/components/Term';
import { SwissChecks } from './Checks';
import { ArrowUpRightIcon } from './icons';
import { SwissServiceTiers } from './ServiceTiers';
import type { SwissServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';
import { SwissTermScope } from './TermScope';

export const SwissServiceThreeD = ({ data, tiers }: SwissServiceThreeDProps) => {
  const t = useTranslations('servicePage.threeD');
  const texts = useTranslations('services.threeD');

  return (
    <>
      <section
        className={page.block}
        aria-labelledby="service-media"
      >
        <SwissTermScope>
          <div className={page.blockHead}>
            <h2
              className={page.blockTitle}
              id="service-media"
            >
              {t('mediaHeading')}
            </h2>
            <p className={page.blockNote}>
              <Terms text={t('mediaNote')} />
            </p>
          </div>
          <ServiceMedia
            posters={data.posters}
            video={data.video}
            classes={{ frame: styles.frame, poster: styles.poster, video: styles.video, play: styles.play }}
          />
          <a
            className={page.more}
            href={data.demoHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('demo')}
            <ArrowUpRightIcon />
          </a>
        </SwissTermScope>
      </section>

      {tiers ? <SwissServiceTiers data={tiers} /> : null}

      <section
        className={page.block}
        aria-labelledby="service-terms"
      >
        <SwissTermScope>
          <div className={page.blockHead}>
            <h2
              className={page.blockTitle}
              id="service-terms"
            >
              {t('termsHeading')}
            </h2>
            <p className={page.blockNote}>
              <Terms text={data.terms.note} />
            </p>
          </div>
          <SwissChecks items={data.terms.items} />
          <p className={styles.note}>
            {richTerms(
              texts.rich('webgl', {
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
              }),
            )}
          </p>
        </SwissTermScope>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-needs"
      >
        <SwissTermScope>
          <div className={page.blockHead}>
            <h2
              className={page.blockTitle}
              id="service-needs"
            >
              {t('needsHeading')}
            </h2>
            <p className={page.blockNote}>
              <Terms text={data.needs.note} />
            </p>
          </div>
          <SwissChecks items={data.needs.items} />
          <p className={styles.note}>
            <Terms text={data.model} />
          </p>
        </SwissTermScope>
      </section>
    </>
  );
};
