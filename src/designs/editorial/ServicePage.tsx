import { useTranslations } from 'next-intl';
import type { ServicePageProps } from '@/components/ServicePage/types';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import { Terms } from '@/components/Term';
import { useProcessCards } from '@/components/use-process-cards';
import { EditorialBasics } from './Basics';
import { EditorialDashes } from './Dashes';
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from './icons';
import { EditorialOptions } from './Options';
import { EditorialServiceThreeD } from './ServiceThreeD';
import { EditorialServiceTiers } from './ServiceTiers';
import { EditorialProcessCards } from './ProcessCards';
import { EditorialAudit } from './Audit';
import styles from './ServicePage.module.scss';
import { EditorialTermScope } from './TermScope';

export const EditorialServicePage = ({ service }: ServicePageProps) => {
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

  return (
    <EditorialTermScope>
      <>
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
            <div className={styles.margin}>
              <p className={styles.kicker}>{t('kicker')}</p>
            </div>
            <div className={styles.headMain}>
              <h1 className={styles.title}>{name}</h1>
              <p className={styles.lead}>{summary}</p>
              <ul className={styles.tags}>
                <li className={styles.tag}>{term}</li>
                <li className={styles.tag}>{price}</li>
                {hasRevisions ? <li className={styles.tag}>{t('revisions')}</li> : null}
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
                </a>
                <span className={styles.note}>{priceKind}</span>
              </div>
            </div>
          </header>

          <div className={styles.cols}>
            <div className={styles.content}>
              {tryIt ? (
                <section
                  className={styles.block}
                  aria-labelledby="service-try-it"
                >
                  <EditorialTermScope>
                    <div className={styles.blockHead}>
                      <h2
                        className={styles.blockTitle}
                        id="service-try-it"
                      >
                        {tryIt.heading}
                      </h2>
                      <p className={styles.note}>
                        <Terms text={tryIt.note} />
                      </p>
                    </div>
                    <ul className={`${styles.niches} ${styles.apps}`}>
                      {tryIt.apps.map((app) => (
                        <li
                          className={styles.app}
                          key={app.id}
                        >
                          <p className={styles.kicker}>
                            <Terms text={app.module} />
                          </p>
                          <h3 className={styles.nicheTitle}>{app.title}</h3>
                          <p className={styles.nicheText}>
                            <Terms text={app.text} />
                          </p>
                          <span className={`${styles.tag} ${styles.appMark}`}>
                            <Terms text={tryIt.mark} />
                          </span>
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
                  </EditorialTermScope>
                </section>
              ) : null}

              {industry ? (
                <section
                  className={styles.block}
                  aria-labelledby="service-included"
                >
                  <EditorialTermScope>
                    <div className={styles.blockHead}>
                      <h2
                        className={styles.blockTitle}
                        id="service-included"
                      >
                        {t('includedHeading')}
                      </h2>
                      <p className={styles.note}>
                        <Terms text={industry.included.note} />
                      </p>
                    </div>
                    <EditorialDashes items={industry.included.items} />
                  </EditorialTermScope>
                </section>
              ) : null}

              {threeD ? (
                <EditorialServiceThreeD
                  data={threeD}
                  tiers={tiers}
                />
              ) : tiers ? (
                <EditorialServiceTiers data={tiers} />
              ) : null}

              <section
                className={styles.block}
                aria-labelledby="service-basics"
              >
                <EditorialTermScope>
                  <div className={styles.blockHead}>
                    <h2
                      className={styles.blockTitle}
                      id="service-basics"
                    >
                      {t('basicsHeading')}
                    </h2>
                    <p className={styles.note}>
                      <Terms text={ownBasics ? ownBasics.note : t('basicsNote')} />
                    </p>
                  </div>
                  {ownBasics ? (
                    <EditorialDashes items={ownBasics.items} />
                  ) : (
                    <EditorialBasics
                      titleTag="h3"
                      narrow
                    />
                  )}
                </EditorialTermScope>
              </section>

              {industry ? (
                <>
                  <section
                    className={styles.block}
                    aria-labelledby="service-excluded"
                  >
                    <EditorialTermScope>
                      <div className={styles.blockHead}>
                        <h2
                          className={styles.blockTitle}
                          id="service-excluded"
                        >
                          {t('excludedHeading')}
                        </h2>
                        <p className={styles.note}>
                          <Terms text={industry.excluded.note} />
                        </p>
                      </div>
                      <EditorialDashes
                        items={industry.excluded.items}
                        skipped
                      />
                    </EditorialTermScope>
                  </section>

                  <section
                    className={styles.block}
                    aria-labelledby="service-niches"
                  >
                    <EditorialTermScope>
                      <div className={styles.blockHead}>
                        <h2
                          className={styles.blockTitle}
                          id="service-niches"
                        >
                          {t('nichesHeading')}
                        </h2>
                        <p className={styles.note}>
                          <Terms text={t('nichesNote')} />
                        </p>
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
                            <p className={styles.nicheText}>
                              <Terms text={niche.text} />
                            </p>
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
                                <Terms text={t('nicheCta')} />
                                <ArrowRightIcon className={styles.nicheArrow} />
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </EditorialTermScope>
                  </section>
                </>
              ) : null}

              {options.length > 0 ? (
                <section
                  className={styles.block}
                  aria-labelledby="service-options"
                >
                  <EditorialTermScope>
                    <div className={styles.blockHead}>
                      <h2
                        className={styles.blockTitle}
                        id="service-options"
                      >
                        {t('optionsHeading')}
                      </h2>
                      <p className={styles.note}>
                        <Terms text={t('optionsNote')} />
                      </p>
                    </div>
                    <EditorialOptions
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
                  </EditorialTermScope>
                </section>
              ) : null}

              <section
                className={styles.block}
                aria-labelledby="service-process"
              >
                <EditorialTermScope>
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
                    {cards.prestart ? (
                      <EditorialProcessCards
                        block={cards.prestart}
                        narrow
                      />
                    ) : null}
                    <ol
                      className={styles.steps}
                      data-testid="service-steps"
                    >
                      {steps.map((step) => (
                        <li
                          className={styles.step}
                          key={step.title}
                        >
                          <span className={styles.kicker}>
                            <Terms text={step.when} />
                          </span>
                          <h3 className={styles.stepTitle}>{step.title}</h3>
                          <p className={styles.stepText}>
                            <Terms text={step.text} />
                          </p>
                        </li>
                      ))}
                    </ol>
                    {cards.after ? (
                      <EditorialProcessCards
                        block={cards.after}
                        narrow
                      />
                    ) : null}
                  </div>
                </EditorialTermScope>
              </section>

              {faq.length > 0 ? (
                <section
                  className={styles.block}
                  aria-labelledby="service-faq"
                >
                  <EditorialTermScope>
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
                          <p className={styles.answer}>
                            <Terms text={item.answer} />
                          </p>
                        </details>
                      ))}
                    </div>
                  </EditorialTermScope>
                </section>
              ) : null}
            </div>

            <aside className={styles.side}>
              <div className={styles.card}>
                <span className={styles.kicker}>
                  <Terms text={priceKind} />
                </span>
                <span className={styles.amount}>{cardAmount}</span>
                <span className={styles.tag}>
                  <Terms text={term} />
                </span>
                {cardPoints.length > 0 ? (
                  <div className={styles.points}>
                    <EditorialDashes items={cardPoints} />
                  </div>
                ) : null}
                <a
                  className={styles.cardCta}
                  href={data.briefHref}
                  data-testid="service-cta"
                >
                  {t('cta')}
                </a>
              </div>
            </aside>
          </div>
        </article>
        {industry ? <EditorialAudit /> : null}
      </>
    </EditorialTermScope>
  );
};
