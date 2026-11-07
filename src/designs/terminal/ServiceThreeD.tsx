import { useTranslations } from 'next-intl';
import { ServiceMedia } from '@/components/ServiceMedia';
import { richTerms, Terms } from '@/components/Term';
import { TerminalChecks } from './Checks';
import { TerminalServiceTiers } from './ServiceTiers';
import type { TerminalServiceThreeDProps } from './types';
import page from './ServicePage.module.scss';
import styles from './ServiceThreeD.module.scss';
import { TerminalTermScope } from './TermScope';

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
        <TerminalTermScope>
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
        </TerminalTermScope>
      </section>

      {tiers ? <TerminalServiceTiers data={tiers} /> : null}

      <section
        className={page.block}
        aria-labelledby="service-terms"
      >
        <TerminalTermScope>
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
          <TerminalChecks items={data.terms.items} />
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
        </TerminalTermScope>
      </section>

      <section
        className={page.block}
        aria-labelledby="service-needs"
      >
        <TerminalTermScope>
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
          <TerminalChecks items={data.needs.items} />
          <p className={styles.note}>
            <Terms text={data.model} />
          </p>
        </TerminalTermScope>
      </section>
    </>
  );
};
