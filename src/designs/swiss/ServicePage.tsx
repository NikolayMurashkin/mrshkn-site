import { useTranslations } from 'next-intl';
import type { ServicePageProps } from '@/components/ServicePage/types';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import { useProcessCards } from '@/components/use-process-cards';
import { splitStepWhen } from '../step-when';
import { SwissBasics } from './Basics';
import { SwissChecks } from './Checks';
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from './icons';
import { SwissOptions } from './Options';
import { SwissSteps } from './Steps';
import { SwissServiceThreeD } from './ServiceThreeD';
import { SwissServiceTiers } from './ServiceTiers';
import { SwissProcessCards } from './ProcessCards';
import styles from './ServicePage.module.scss';

export const SwissServicePage = ({ service }: ServicePageProps) => {
  const t = useTranslations('servicePage');
  const data = useServicePage(service);
  const cards = useProcessCards(service);

  if (!data) {
    return null;
  }

  const {
    name,
    summary,
    term,
    price,
    cardAmount,
    priceKind,
    hasRevisions,
    cardPoints,
    ownBasics,
    industry,
    tiers,
    threeD,
    tryIt,
    exampleHref,
    options,
    steps,
    faq,
  } = data;
  const revisions = t('revisions');
  const points = hasRevisions ? [...cardPoints, revisions] : cardPoints;

  return (
    <article
      className={styles.page}
      data-testid="service-page"
      data-service={data.service.id}
    >
      <a
        className={styles.back}
        href={data.backHref}
      >
        <ArrowLeftIcon />
        {t('back')}
      </a>

      <header className={styles.head}>
        <div className={styles.headAside}>
          <p className={styles.kicker}>{t('kicker')}</p>
        </div>
        <div className={styles.headMain}>
          <h1 className={styles.title}>{name}</h1>
          <p className={styles.lead}>{summary}</p>
          <ul className={styles.tags}>
            <li className={styles.tag}>{term}</li>
            <li className={styles.tag}>{price}</li>
            {hasRevisions ? <li className={styles.tag}>{revisions}</li> : null}
          </ul>
          {exampleHref ? (
            <a
              className={`${styles.more} ${styles.example}`}
              href={exampleHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('landingExample')}
              <ArrowUpRightIcon />
            </a>
          ) : null}
          <div className={styles.meta}>
            <a
              className={styles.cta}
              href={data.briefHref}
            >
              {t('cta')}
              <ArrowRightIcon />
            </a>
            <span className={styles.kind}>{priceKind}</span>
          </div>
        </div>
      </header>

      <div className={styles.cols}>
        <div className={styles.stack}>
          {tryIt ? (
            <section
              className={styles.block}
              aria-labelledby="service-try-it"
            >
              <div className={styles.blockHead}>
                <h2
                  className={styles.blockTitle}
                  id="service-try-it"
                >
                  {tryIt.heading}
                </h2>
                <p className={styles.blockNote}>{tryIt.note}</p>
              </div>
              <ul className={`${styles.niches} ${styles.apps}`}>
                {tryIt.apps.map((app) => (
                  <li
                    className={styles.app}
                    key={app.id}
                  >
                    <p className={styles.kicker}>{app.module}</p>
                    <h3 className={styles.nicheTitle}>{app.title}</h3>
                    <p className={styles.nicheText}>{app.text}</p>
                    <span className={styles.tag}>{tryIt.mark}</span>
                    <div className={styles.appLinks}>
                      {app.links.map((link) => (
                        <a
                          className={styles.appLink}
                          href={link.href}
                          key={link.messenger}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                          <ArrowUpRightIcon />
                        </a>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {industry ? (
            <section
              className={styles.block}
              aria-labelledby="service-included"
            >
              <div className={styles.blockHead}>
                <h2
                  className={styles.blockTitle}
                  id="service-included"
                >
                  {t('includedHeading')}
                </h2>
                <p className={styles.blockNote}>{industry.included.note}</p>
              </div>
              <SwissChecks items={industry.included.items} />
            </section>
          ) : null}

          {threeD ? (
            <SwissServiceThreeD
              data={threeD}
              tiers={tiers}
            />
          ) : tiers ? (
            <SwissServiceTiers data={tiers} />
          ) : null}

          <section
            className={styles.block}
            aria-labelledby="service-basics"
          >
            <div className={styles.blockHead}>
              <h2
                className={styles.blockTitle}
                id="service-basics"
              >
                {t('basicsHeading')}
              </h2>
              <p className={styles.blockNote}>{ownBasics ? ownBasics.note : t('basicsNote')}</p>
            </div>
            {ownBasics ? (
              <SwissChecks items={ownBasics.items} />
            ) : (
              <SwissBasics
                titleTag="h3"
                narrow
              />
            )}
          </section>

          {industry ? (
            <>
              <section
                className={styles.block}
                aria-labelledby="service-excluded"
              >
                <div className={styles.blockHead}>
                  <h2
                    className={styles.blockTitle}
                    id="service-excluded"
                  >
                    {t('excludedHeading')}
                  </h2>
                  <p className={styles.blockNote}>{industry.excluded.note}</p>
                </div>
                <SwissChecks
                  items={industry.excluded.items}
                  skipped
                />
              </section>

              <section
                className={styles.block}
                aria-labelledby="service-niches"
              >
                <div className={styles.blockHead}>
                  <h2
                    className={styles.blockTitle}
                    id="service-niches"
                  >
                    {t('nichesHeading')}
                  </h2>
                  <p className={styles.blockNote}>{t('nichesNote')}</p>
                </div>
                <ul className={styles.niches}>
                  {industry.niches.map((niche) => (
                    <li
                      className={styles.niche}
                      key={niche.id}
                    >
                      <h3 className={styles.nicheTitle}>
                        <a href={niche.href}>{niche.title}</a>
                      </h3>
                      <p className={styles.nicheText}>{niche.text}</p>
                      <div className={styles.nicheEnd}>
                        <a
                          className={`${styles.more} ${styles.nicheDemo}`}
                          href={niche.demoHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('nicheDemo')}
                          <ArrowUpRightIcon />
                        </a>
                        <span className={styles.nicheFoot}>
                          {t('nicheCta')}
                          <span className={styles.nicheArrow}>
                            <ArrowRightIcon />
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

          {options.length > 0 ? (
            <section
              className={styles.block}
              aria-labelledby="service-options"
            >
              <div className={styles.blockHead}>
                <h2
                  className={styles.blockTitle}
                  id="service-options"
                >
                  {t('optionsHeading')}
                </h2>
                <p className={styles.blockNote}>{t('optionsNote')}</p>
              </div>
              <SwissOptions
                items={options}
                testId="service-options"
                narrow
              />
              <a
                className={styles.more}
                href={data.pricesHref}
              >
                {t('allOptions')}
                <ArrowRightIcon />
              </a>
            </section>
          ) : null}

          <section
            className={styles.block}
            aria-labelledby="service-process"
          >
            <div className={styles.blockHead}>
              <h2
                className={styles.blockTitle}
                id="service-process"
              >
                {t('processHeading')}
              </h2>
            </div>
            <div
              className={styles.processBody}
              data-testid="service-process"
            >
              {cards.prestart ? <SwissProcessCards block={cards.prestart} /> : null}
              <SwissSteps
                steps={steps.map(({ when, title, text }) => ({ id: title, ...splitStepWhen(when), title, text }))}
                testId="service-steps"
                titleTag="h3"
                narrow
              />
              {cards.after ? <SwissProcessCards block={cards.after} /> : null}
            </div>
          </section>

          {faq.length > 0 ? (
            <section
              className={styles.block}
              aria-labelledby="service-faq"
            >
              <div className={styles.blockHead}>
                <h2
                  className={styles.blockTitle}
                  id="service-faq"
                >
                  {t('faqHeading')}
                </h2>
              </div>
              <div
                className={styles.faq}
                data-testid="service-faq"
              >
                {faq.map((item) => (
                  <details
                    className={styles.question}
                    key={item.question}
                  >
                    <summary className={styles.summary}>{item.question}</summary>
                    <p className={styles.answer}>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.aside}>
          <div className={styles.card}>
            <span className={styles.kicker}>{priceKind}</span>
            <span className={styles.amount}>{cardAmount}</span>
            <span className={styles.tag}>{term}</span>
            {points.length > 0 ? <SwissChecks items={points} /> : null}
            <a
              className={styles.cardCta}
              href={data.briefHref}
              data-testid="service-cta"
            >
              {t('cta')}
              <ArrowRightIcon />
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
};
