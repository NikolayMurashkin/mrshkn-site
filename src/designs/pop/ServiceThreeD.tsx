import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { richTerms, Terms } from '@/components/Term';
import { PopChecks } from './Checks';
import { ArrowUpRightIcon } from './icons';
import { PopServiceTiers } from './ServiceTiers';
import type { PopServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';
import { PopTermScope } from './TermScope';

export const PopServiceThreeD = ({ data, tiers }: PopServiceThreeDProps) => {
  const t = useTranslations('servicePage.threeD');
  const texts = useTranslations('services.threeD');

  return (
    <>
      <section
        className={page.block}
        aria-labelledby="service-media"
      >
        <PopTermScope>
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
        </PopTermScope>
      </section>

      {tiers ? <PopServiceTiers data={tiers} /> : null}

      <section
        className={page.block}
        aria-labelledby="service-terms"
      >
        <PopTermScope>
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
          <div className={page.ownBasics}>
            <PopChecks items={data.terms.items} />
          </div>
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
        </PopTermScope>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-needs"
      >
        <PopTermScope>
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
          <div className={page.ownBasics}>
            <PopChecks items={data.needs.items} />
          </div>
          <p className={styles.note}>
            <Terms text={data.model} />
          </p>
        </PopTermScope>
      </section>
    </>
  );
};
