import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { richTerms, Terms } from '@/components/Term';
import { EditorialDashes } from './Dashes';
import { ArrowUpRightIcon } from './icons';
import { EditorialServiceTiers } from './ServiceTiers';
import type { EditorialServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';
import { EditorialTermScope } from './TermScope';

export const EditorialServiceThreeD = ({ data, tiers }: EditorialServiceThreeDProps) => {
  const t = useTranslations('servicePage.threeD');
  const texts = useTranslations('services.threeD');

  return (
    <>
      <section
        className={page.block}
        aria-labelledby="service-media"
      >
        <EditorialTermScope>
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
            <figcaption className={styles.caption}>
              <Terms text={t('mediaNote')} />
            </figcaption>
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
        </EditorialTermScope>
      </section>

      {tiers ? <EditorialServiceTiers data={tiers} /> : null}

      <section
        className={page.block}
        aria-labelledby="service-terms"
      >
        <EditorialTermScope>
          <div className={page.blockHead}>
            <h2
              className={page.blockTitle}
              id="service-terms"
            >
              {t('termsHeading')}
            </h2>
            <p className={page.note}>
              <Terms text={data.terms.note} />
            </p>
          </div>
          <EditorialDashes items={data.terms.items} />
          <p className={styles.note}>
            {richTerms(
              texts.rich('webgl', {
                link: (chunks) => (
                  <a
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
        </EditorialTermScope>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-needs"
      >
        <EditorialTermScope>
          <div className={page.blockHead}>
            <h2
              className={page.blockTitle}
              id="service-needs"
            >
              {t('needsHeading')}
            </h2>
            <p className={page.note}>
              <Terms text={data.needs.note} />
            </p>
          </div>
          <EditorialDashes items={data.needs.items} />
          <p className={styles.note}>
            <Terms text={data.model} />
          </p>
        </EditorialTermScope>
      </section>
    </>
  );
};
