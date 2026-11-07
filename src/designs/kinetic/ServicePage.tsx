import { useTranslations } from 'next-intl';
import { Terms } from '@/components/Term';
import { PRICING_BASIC_GROUPS } from '@/content/pricing';
import type { ServicePageProps } from '@/components/ServicePage/types';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import { useProcessCards } from '@/components/use-process-cards';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons';
import { KineticAudit } from './Audit';
import { buttonClass } from './button';
import { KineticServiceThreeD } from './ServiceThreeD';
import { KineticServiceTiers } from './ServiceTiers';
import { KineticProcessCards } from './ProcessCards';
import styles from './ServicePage.module.scss';
import { KineticTermScope } from './TermScope';

export const KineticServicePage = ({ service }: ServicePageProps) => {
  const t = useTranslations('servicePage');
  const pricing = useTranslations('pricing');
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
    <KineticTermScope>
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
            ← {t('back')}
          </a>

          <header className={styles.head}>
            <p className={styles.kicker}>{t('kicker')}</p>
            <h1 className={styles.title}>{name}</h1>
            <p className={styles.lead}>{summary}</p>
            <ul className={styles.tags}>
              <li className={styles.tag}>{term}</li>
              <li className={styles.tag}>{price}</li>
              {hasRevisions ? <li className={styles.tag}>{t('revisions')}</li> : null}
            </ul>
            {exampleHref ? (
              <a
                className={`${styles.demoLink} ${styles.example}`}
                href={exampleHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('landingExample')}
                <ArrowUpRightIcon />
              </a>
            ) : null}
            <a
              className={`${buttonClass({ primary: true })} ${styles.headCta}`}
              href={data.briefHref}
            >
              {t('cta')}
              <ArrowRightIcon />
            </a>
          </header>

          <div className={styles.cols}>
            <div className={styles.main}>
              {tryIt ? (
                <section
                  className={styles.block}
                  aria-labelledby="service-try-it"
                >
                  <KineticTermScope>
                    <div className={styles.blockHead}>
                      <h2
                        className={styles.blockTitle}
                        id="service-try-it"
                      >
                        {tryIt.heading}
                      </h2>
                      <p className={styles.blockNote}>
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
                                className={`${buttonClass({ size: 'small' })} ${styles.appLink}`}
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
                  </KineticTermScope>
                </section>
              ) : null}

              {industry ? (
                <section
                  className={styles.block}
                  aria-labelledby="service-included"
                >
                  <KineticTermScope>
                    <div className={styles.blockHead}>
                      <h2
                        className={styles.blockTitle}
                        id="service-included"
                      >
                        {t('includedHeading')}
                      </h2>
                      <p className={styles.blockNote}>
                        <Terms text={industry.included.note} />
                      </p>
                    </div>
                    <ul className={`${styles.checks} ${styles.ownBasics}`}>
                      {industry.included.items.map((item, index) => (
                        <li key={index}>
                          <Terms text={item} />
                        </li>
                      ))}
                    </ul>
                  </KineticTermScope>
                </section>
              ) : null}

              {threeD ? (
                <KineticServiceThreeD
                  data={threeD}
                  tiers={tiers}
                />
              ) : tiers ? (
                <KineticServiceTiers data={tiers} />
              ) : null}

              <section
                className={styles.block}
                aria-labelledby="service-basics"
              >
                <KineticTermScope>
                  <div className={styles.blockHead}>
                    <h2
                      className={styles.blockTitle}
                      id="service-basics"
                    >
                      {t('basicsHeading')}
                    </h2>
                    <p className={styles.blockNote}>
                      <Terms text={ownBasics ? ownBasics.note : t('basicsNote')} />
                    </p>
                  </div>
                  {ownBasics ? (
                    <ul className={`${styles.checks} ${styles.ownBasics}`}>
                      {ownBasics.items.map((item, index) => (
                        <li key={index}>
                          <Terms
                            text={item}
                            nowrapClassName={styles.nowrap}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.groups}>
                      {PRICING_BASIC_GROUPS.map((group) => (
                        <div
                          className={styles.group}
                          key={group.id}
                        >
                          <h3 className={styles.groupTitle}>{pricing(`basicsGroups.${group.id}`)}</h3>
                          <ul className={styles.checks}>
                            {group.items.map((item) => (
                              <li key={item}>
                                <Terms
                                  text={pricing(`basics.${item}`)}
                                  nowrapClassName={styles.nowrap}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </KineticTermScope>
              </section>

              {industry ? (
                <>
                  <section
                    className={styles.block}
                    aria-labelledby="service-excluded"
                  >
                    <KineticTermScope>
                      <div className={styles.blockHead}>
                        <h2
                          className={styles.blockTitle}
                          id="service-excluded"
                        >
                          {t('excludedHeading')}
                        </h2>
                        <p className={styles.blockNote}>
                          <Terms text={industry.excluded.note} />
                        </p>
                      </div>
                      <ul className={`${styles.checks} ${styles.excluded}`}>
                        {industry.excluded.items.map((item, index) => (
                          <li key={index}>
                            <Terms text={item} />
                          </li>
                        ))}
                      </ul>
                    </KineticTermScope>
                  </section>

                  <section
                    className={styles.block}
                    aria-labelledby="service-niches"
                  >
                    <KineticTermScope>
                      <div className={styles.blockHead}>
                        <h2
                          className={styles.blockTitle}
                          id="service-niches"
                        >
                          {t('nichesHeading')}
                        </h2>
                        <p className={styles.blockNote}>
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
                                className={`${styles.demoLink} ${styles.nicheDemo}`}
                                href={niche.demoHref}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t('nicheDemo')}
                                <ArrowUpRightIcon />
                              </a>
                              <span className={styles.nicheFoot}>
                                <Terms text={t('nicheCta')} />
                                <ArrowUpRightIcon />
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </KineticTermScope>
                  </section>
                </>
              ) : null}

              {options.length > 0 ? (
                <section
                  className={styles.block}
                  aria-labelledby="service-options"
                >
                  <KineticTermScope>
                    <div className={styles.blockHead}>
                      <h2
                        className={styles.blockTitle}
                        id="service-options"
                      >
                        {t('optionsHeading')}
                      </h2>
                      <p className={styles.blockNote}>
                        <Terms text={t('optionsNote')} />
                      </p>
                    </div>
                    <ul
                      className={styles.options}
                      data-testid="service-options"
                    >
                      {options.map((option) => (
                        <li
                          className={styles.option}
                          key={option.id}
                        >
                          <span className={styles.optionName}>
                            <Terms text={option.name} />
                          </span>
                          <span className={styles.optionPrice}>{option.amount}</span>
                          <span className={styles.optionNote}>
                            <Terms text={option.note} />
                          </span>
                        </li>
                      ))}
                    </ul>
                    <a
                      className={styles.more}
                      href={data.pricesHref}
                    >
                      {t('allOptions')}
                    </a>
                  </KineticTermScope>
                </section>
              ) : null}

              <section
                className={styles.block}
                aria-labelledby="service-process"
              >
                <KineticTermScope>
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
                      <KineticProcessCards
                        block={cards.prestart}
                        narrow
                      />
                    ) : null}
                    <ol
                      className={styles.steps}
                      data-testid="service-steps"
                    >
                      {steps.map((step, index) => (
                        <li
                          className={styles.step}
                          key={index}
                        >
                          <span className={styles.stepIndex}>{String(index + 1).padStart(2, '0')}</span>
                          <span className={styles.when}>
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
                      <KineticProcessCards
                        block={cards.after}
                        narrow
                      />
                    ) : null}
                  </div>
                </KineticTermScope>
              </section>

              <section
                className={styles.block}
                aria-labelledby="service-faq"
              >
                <KineticTermScope>
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
                    {faq.map((item, index) => (
                      <details
                        className={styles.question}
                        key={index}
                      >
                        <summary className={styles.summary}>{item.question}</summary>
                        <p className={styles.answer}>
                          <Terms text={item.answer} />
                        </p>
                      </details>
                    ))}
                  </div>
                </KineticTermScope>
              </section>
            </div>

            <aside className={styles.aside}>
              <div className={styles.card}>
                <p className={styles.kicker}>
                  <Terms text={priceKind} />
                </p>
                <div className={styles.cardPrice}>
                  <span className={styles.amount}>{cardAmount}</span>
                  <span className={styles.cardTerm}>
                    <Terms text={term} />
                  </span>
                </div>
                {cardPoints.length > 0 ? (
                  <ul className={styles.checks}>
                    {cardPoints.map((point) => (
                      <li key={point}>
                        <Terms text={point} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                <a
                  className={buttonClass({ primary: true })}
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
        {industry ? <KineticAudit /> : null}
      </>
    </KineticTermScope>
  );
};
