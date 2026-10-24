import { useTranslations } from 'next-intl';
import { useGoal } from '@/components/Analytics/use-consent';
import { planPath } from '@/content/format';
import { PRICING_EXTRAS, PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { usePriceText } from '@/content/use-price';
import { Link } from '@/i18n/navigation';
import { GOALS } from '@/lib/analytics/consts';
import { EditorialBasics } from './Basics';
import { EditorialOptions } from './Options';
import { EditorialRubric } from './Rubric';
import styles from './Pricing.module.scss';

export const EditorialPricing = () => {
  const t = useTranslations('pricing');
  const price = usePriceText();
  const reachGoal = useGoal();

  return (
    <section
      className={styles.pricing}
      id="services"
      data-testid="pricing"
      aria-labelledby="pricing-heading"
    >
      <div className={styles.head}>
        <EditorialRubric
          label={t('sectionMark')}
          note={t('note')}
        />
        <h2
          className={styles.title}
          id="pricing-heading"
        >
          {t('editorial.heading')}
        </h2>
      </div>

      <div className={styles.stack}>
        <ul
          className={styles.toc}
          id="prices"
        >
          {PRICING_PLANS.map((plan) => (
            <li
              className={styles.plan}
              data-testid={`plan-${plan.id}`}
              key={plan.id}
            >
              <Link
                className={styles.planLink}
                href={planPath(plan)}
                onClick={() => reachGoal(GOALS.planClick)}
                aria-label={t('planLink', { name: t(`plans.${plan.id}.name`) })}
              >
                <span className={styles.line}>
                  <span className={styles.name}>{t(`plans.${plan.id}.name`)}</span>
                  <span
                    className={styles.leader}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.price}>{price.plan(plan)}</span>
                <span className={styles.summary}>{t(`plans.${plan.id}.summary`)}</span>
                <span className={styles.term}>{price.term(plan)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p
          className={styles.caseOffer}
          data-testid="case-offer"
        >
          {t('caseOffer')}
        </p>

        <div
          className={styles.miniApp}
          data-testid="mini-app-note"
        >
          <p className={styles.miniAppTitle}>{t('miniAppNote.title')}</p>
          <p className={styles.miniAppText}>{t('miniAppNote.text', { max: price.max })}</p>
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h3 className={styles.blockTitle}>{t('basicsHeading')}</h3>
            <p className={styles.blockNote}>{t('basicsNote')}</p>
          </div>
          <EditorialBasics titleTag="h4" />
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h3 className={styles.blockTitle}>{t('optionsHeading')}</h3>
            <p className={styles.blockNote}>{t('optionsNote')}</p>
          </div>
          <EditorialOptions
            items={PRICING_OPTIONS.map((option) => ({
              id: option.id,
              name: t(`options.${option.id}.name`),
              note: t(`options.${option.id}.note`),
              ...price.option(option),
            }))}
            testId="options"
          />
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h3 className={styles.blockTitle}>{t('extrasHeading')}</h3>
            <p className={styles.blockNote}>{t('extrasNote')}</p>
          </div>
          <ul
            className={styles.extras}
            data-testid="extras"
          >
            {PRICING_EXTRAS.map((extra) => (
              <li
                className={styles.extra}
                key={extra.id}
              >
                <div className={styles.extraHead}>
                  <h4 className={styles.extraName}>{t(`extras.${extra.id}.name`)}</h4>
                  <span className={styles.extraPrice}>{price.extra(extra)}</span>
                </div>
                <p className={styles.extraSummary}>{t(`extras.${extra.id}.summary`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
