import { useTranslations } from 'next-intl';
import { useGoal } from '@/components/Analytics/use-consent';
import { planPath } from '@/content/format';
import { PRICING_EXTRAS, PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { usePriceText } from '@/content/use-price';
import { Link } from '@/i18n/navigation';
import { GOALS } from '@/lib/analytics/consts';
import { PopBasics } from './Basics';
import { ArrowUpRightIcon, StarIcon } from './icons';
import { PopOptions } from './Options';
import styles from './Pricing.module.scss';

export const PopPricing = () => {
  const t = useTranslations('pricing');
  const price = usePriceText();
  const reachGoal = useGoal();
  const options = PRICING_OPTIONS.map((option) => ({
    id: option.id,
    name: t(`options.${option.id}.name`),
    note: t(`options.${option.id}.note`),
    ...price.option(option),
  }));

  return (
    <section
      className={styles.pricing}
      id="services"
      data-testid="pricing"
      aria-labelledby="pricing-heading"
    >
      <div className={styles.head}>
        <h2
          className={styles.heading}
          id="pricing-heading"
        >
          {t('heading')}
        </h2>
        <p className={styles.note}>{t('note')}</p>
      </div>

      <ul
        className={styles.plans}
        id="prices"
      >
        {PRICING_PLANS.map((plan) => (
          <li
            className={styles.plan}
            data-testid={`plan-${plan.id}`}
            key={plan.id}
          >
            <Link
              className={styles.card}
              href={planPath(plan)}
              onClick={() => reachGoal(GOALS.planClick)}
              aria-label={t('planLink', { name: t(`plans.${plan.id}.name`) })}
            >
              <span className={styles.tag}>{t(`plans.${plan.id}.term`)}</span>
              <span className={styles.name}>{t(`plans.${plan.id}.name`)}</span>
              <span className={styles.summary}>{t(`plans.${plan.id}.summary`)}</span>
              <span className={styles.foot}>
                <span className={styles.price}>{price.plan(plan)}</span>
                <span
                  className={styles.round}
                  aria-hidden="true"
                >
                  <ArrowUpRightIcon />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        className={styles.callout}
        data-testid="mini-app-note"
      >
        <p className={styles.calloutTitle}>{t('miniAppNote.title')}</p>
        <p className={styles.calloutText}>{t('miniAppNote.text')}</p>
        <StarIcon
          className={styles.calloutStar}
          size={96}
        />
      </div>

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('basicsHeading')}</h3>
          <p className={styles.blockNote}>{t('basicsNote')}</p>
        </div>
        <PopBasics titleTag="h4" />
      </div>

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('optionsHeading')}</h3>
          <p className={styles.blockNote}>{t('optionsNote')}</p>
        </div>
        <PopOptions
          items={options}
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
    </section>
  );
};
