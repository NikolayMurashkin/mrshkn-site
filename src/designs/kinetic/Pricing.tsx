import { useTranslations } from 'next-intl';
import { useGoal } from '@/components/Analytics/use-consent';
import { planPath } from '@/content/format';
import { PRICING_BASIC_GROUPS, PRICING_EXTRAS, PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { usePriceText } from '@/content/use-price';
import { renderNowrap } from '@/designs/nowrap';
import { Link } from '@/i18n/navigation';
import { GOALS } from '@/lib/analytics/consts';
import { ArrowUpRightIcon } from './icons';
import { SectionHead } from './SectionHead';
import styles from './Pricing.module.scss';

export const KineticPricing = () => {
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
      <SectionHead
        id="pricing-heading"
        kicker={t('kineticKicker')}
        title={t('heading')}
        note={t('note')}
      />

      <ul
        className={styles.plans}
        id="prices"
      >
        {PRICING_PLANS.map((plan, index) => (
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
              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.body}>
                <span className={styles.name}>{t(`plans.${plan.id}.name`)}</span>
                <span className={styles.summary}>{t(`plans.${plan.id}.summary`)}</span>
              </span>
              <span className={styles.term}>{price.term(plan)}</span>
              <span className={styles.price}>{price.plan(plan)}</span>
              <span className={styles.arrow}>
                <ArrowUpRightIcon
                  size={28}
                  strokeWidth={2}
                />
              </span>
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
        className={styles.callout}
        data-testid="mini-app-note"
      >
        <p className={styles.calloutTitle}>{t('miniAppNote.title')}</p>
        <p className={styles.calloutText}>{t('miniAppNote.text', { max: price.max })}</p>
      </div>

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('basicsHeading')}</h3>
          <p className={styles.blockNote}>{t('basicsNote')}</p>
        </div>
        <div
          className={styles.groups}
          data-testid="basics"
        >
          {PRICING_BASIC_GROUPS.map((group) => (
            <div
              className={styles.group}
              data-testid="basics-group"
              key={group.id}
            >
              <h4 className={styles.groupTitle}>{t(`basicsGroups.${group.id}`)}</h4>
              <ul className={styles.checks}>
                {group.items.map((item) => (
                  <li key={item}>{renderNowrap(t(`basics.${item}`), styles.nowrap)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('optionsHeading')}</h3>
          <p className={styles.blockNote}>{t('optionsNote')}</p>
        </div>
        <ul
          className={styles.options}
          data-testid="options"
        >
          {PRICING_OPTIONS.map((option) => {
            const { amount, monthly } = price.option(option);

            return (
              <li
                className={styles.option}
                key={option.id}
              >
                <span className={styles.optionName}>{t(`options.${option.id}.name`)}</span>
                <span
                  className={styles.optionPrice}
                  data-testid="option-price"
                >
                  {amount}
                </span>
                <span className={styles.optionNote}>{t(`options.${option.id}.note`)}</span>
                {monthly ? <span className={styles.optionMonthly}>{monthly}</span> : null}
              </li>
            );
          })}
        </ul>
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
              <h4 className={styles.extraName}>{t(`extras.${extra.id}.name`)}</h4>
              <p className={styles.extraSummary}>{t(`extras.${extra.id}.summary`)}</p>
              <span className={styles.extraPrice}>{price.extra(extra)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
