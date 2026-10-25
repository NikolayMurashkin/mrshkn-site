import { useTranslations } from 'next-intl';
import type { ServicePageProps } from '@/components/ServicePage/types';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import { TerminalBasics } from './Basics';
import { TerminalChecks } from './Checks';
import { TerminalOptions } from './Options';
import { TerminalSteps } from './Steps';
import { TerminalServiceThreeD } from './ServiceThreeD';
import { TerminalServiceTiers } from './ServiceTiers';
import styles from './ServicePage.module.scss';

export const TerminalServicePage = ({ service }: ServicePageProps) => {
  const t = useTranslations('servicePage');
  const data = useServicePage(service);

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
        ← {t('back')}
      </a>

      <header className={styles.head}>
        <p className={styles.label}>{t('kicker')}</p>
        <h1 className={styles.title}>{name}</h1>
        <p className={styles.lead}>{summary}</p>
        <ul className={styles.tags}>
          <li className={styles.tag}>{term}</li>
          <li className={styles.tag}>{price}</li>
          {hasRevisions ? <li className={styles.tag}>{t('revisions')}</li> : null}
        </ul>
        {exampleHref ? (
          <a
            className={styles.example}
            href={exampleHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('landingExample')}
          </a>
        ) : null}
      </header>

      <div className={styles.cols}>
        <aside className={styles.aside}>
          <div className={styles.card}>
            <p className={styles.label}>{priceKind}</p>
            <div className={styles.price}>
              <span className={styles.amount}>{cardAmount}</span>
              <span className={styles.term}>{term}</span>
            </div>
            {cardPoints.length > 0 ? <TerminalChecks items={cardPoints} /> : null}
            <a
              className={styles.cta}
              href={data.briefHref}
              data-testid="service-cta"
            >
              {t('cta')}
            </a>
          </div>
        </aside>

        <div className={styles.main}>
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
              <ul className={styles.niches}>
                {tryIt.apps.map((app) => (
                  <li
                    className={styles.app}
                    key={app.id}
                  >
                    <p className={styles.label}>{app.module}</p>
                    <h3 className={styles.nicheTitle}>{app.title}</h3>
                    <p className={styles.nicheText}>{app.text}</p>
                    <span className={`${styles.tag} ${styles.appMark}`}>{tryIt.mark}</span>
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
              <TerminalChecks items={industry.included.items} />
            </section>
          ) : null}

          {threeD ? (
            <TerminalServiceThreeD
              data={threeD}
              tiers={tiers}
            />
          ) : tiers ? (
            <TerminalServiceTiers data={tiers} />
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
              <TerminalChecks items={ownBasics.items} />
            ) : (
              <TerminalBasics
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
                <TerminalChecks
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
                      <div className={styles.nicheHead}>
                        <h3 className={styles.nicheTitle}>
                          <a href={niche.href}>{niche.title}</a>
                        </h3>
                        <span className={styles.nicheCta}>{t('nicheCta')}</span>
                      </div>
                      <p className={styles.nicheText}>{niche.text}</p>
                      <a
                        className={styles.nicheDemo}
                        href={niche.demoHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('nicheDemo')}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

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
            <TerminalOptions
              items={options}
              testId="service-options"
              narrow
            />
            <a
              className={styles.more}
              href={data.pricesHref}
            >
              {t('allOptions')}
            </a>
          </section>

          <section
            className={styles.block}
            aria-labelledby="service-process"
          >
            <h2
              className={styles.blockTitle}
              id="service-process"
            >
              {t('processHeading')}
            </h2>
            <TerminalSteps
              steps={steps.map(({ when, title, text }, index) => ({ id: String(index), label: when, title, text }))}
              testId="service-process"
              titleTag="h3"
              narrow
            />
          </section>

          <section
            className={styles.block}
            aria-labelledby="service-faq"
          >
            <h2
              className={styles.blockTitle}
              id="service-faq"
            >
              {t('faqHeading')}
            </h2>
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
        </div>
      </div>
    </article>
  );
};
