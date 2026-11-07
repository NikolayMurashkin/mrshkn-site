import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { richTerms, Terms } from '@/components/Term';
import { ArrowUpRightIcon } from './icons';
import { buttonClass } from './button';
import { KineticServiceTiers } from './ServiceTiers';
import type { KineticServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';
import { KineticTermScope } from './TermScope';

export const KineticServiceThreeD = ({ data, tiers }: KineticServiceThreeDProps) => {
  const t = useTranslations('servicePage.threeD');
  const texts = useTranslations('services.threeD');

  return (
    <>
      <section
        className={page.block}
        aria-labelledby="service-media"
      >
        <KineticTermScope>
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
        </KineticTermScope>
      </section>

      {tiers ? <KineticServiceTiers data={tiers} /> : null}

      <section
        className={page.block}
        aria-labelledby="service-terms"
      >
        <KineticTermScope>
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
          <ul className={`${page.checks} ${page.ownBasics}`}>
            {data.terms.items.map((item) => (
              <li key={item}>
                <Terms text={item} />
              </li>
            ))}
          </ul>
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
        </KineticTermScope>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-needs"
      >
        <KineticTermScope>
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
          <ul className={`${page.checks} ${page.ownBasics}`}>
            {data.needs.items.map((item) => (
              <li key={item}>
                <Terms text={item} />
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            <Terms text={data.model} />
          </p>
        </KineticTermScope>
      </section>
    </>
  );
};
