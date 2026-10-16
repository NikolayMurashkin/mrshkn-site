import { useTranslations } from 'next-intl';
import type { ServicePageProps } from '@/components/ServicePage/types';
import { useServicePage } from '@/components/ServicePage/use-service-page';
import { EditorialBasics } from './Basics';
import { EditorialDashes } from './Dashes';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';
import { EditorialOptions } from './Options';
import { EditorialServiceThreeD } from './ServiceThreeD';
import styles from './ServicePage.module.scss';

export const EditorialServicePage = ({ service }: ServicePageProps) => {
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
    threeD,
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
                <p className={styles.note}>{industry.included.note}</p>
              </div>
              <EditorialDashes items={industry.included.items} />
            </section>
          ) : null}

          {threeD ? <EditorialServiceThreeD data={threeD} /> : null}

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
              <p className={styles.note}>{ownBasics ? ownBasics.note : t('basicsNote')}</p>
            </div>
            {ownBasics ? (
              <EditorialDashes items={ownBasics.items} />
            ) : (
              <EditorialBasics
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
                  <p className={styles.note}>{industry.excluded.note}</p>
                </div>
                <EditorialDashes
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
                  <p className={styles.note}>{t('nichesNote')}</p>
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
                      <span className={styles.nicheFoot}>
                        {t('nicheCta')}
                        <ArrowRightIcon className={styles.nicheArrow} />
                      </span>
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
                <p className={styles.note}>{t('optionsNote')}</p>
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
            <ol
              className={styles.steps}
              data-testid="service-process"
            >
              {steps.map((step) => (
                <li
                  className={styles.step}
                  key={step.title}
                >
                  <span className={styles.kicker}>{step.when}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </li>
              ))}
            </ol>
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

        <aside className={styles.side}>
          <div className={styles.card}>
            <span className={styles.kicker}>{priceKind}</span>
            <span className={styles.amount}>{cardAmount}</span>
            <span className={styles.tag}>{term}</span>
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
  );
};
