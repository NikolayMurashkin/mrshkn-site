import { useLocale, useTranslations } from 'next-intl';
import { planHref } from '@/content/format';
import { PRICING_BASICS, PRICING_EXTRAS, PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { usePriceText } from '@/content/use-price';
import styles from './Pricing.module.scss';

export const KineticPricing = () => {
  const t = useTranslations('pricing');
  const locale = useLocale();
  const price = usePriceText();

  return (
    <section
      className={styles.pricing}
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

      <ul className={styles.plans}>
        {PRICING_PLANS.map((plan, index) => (
          <li
            className={styles.plan}
            data-testid={`plan-${plan.id}`}
            key={plan.id}
          >
            <a
              className={styles.planLink}
              href={planHref(locale, plan)}
              aria-label={t('planLink', { name: t(`plans.${plan.id}.name`) })}
            >
              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.body}>
                <span className={styles.name}>{t(`plans.${plan.id}.name`)}</span>
                <span className={styles.summary}>{t(`plans.${plan.id}.summary`)}</span>
              </span>
              <span className={styles.term}>{t(`plans.${plan.id}.term`)}</span>
              <span className={styles.price}>{price.plan(plan)}</span>
              <svg
                className={styles.arrow}
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M8 7h9v9" />
              </svg>
            </a>
          </li>
        ))}
      </ul>

      <div
        className={styles.miniApp}
        data-testid="mini-app-note"
      >
        <p className={styles.miniAppTitle}>{t('miniAppNote.title')}</p>
        <p className={styles.miniAppText}>{t('miniAppNote.text')}</p>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <h3 className={styles.detailHeading}>{t('basicsHeading')}</h3>
          <ul
            className={styles.basics}
            data-testid="basics"
          >
            {PRICING_BASICS.map((item) => (
              <li
                className={styles.basic}
                key={item}
              >
                {t(`basics.${item}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.detail}>
          <h3 className={styles.detailHeading}>{t('optionsHeading')}</h3>
          <ul
            className={styles.options}
            data-testid="options"
          >
            {PRICING_OPTIONS.map((option) => (
              <li
                className={styles.option}
                key={option.id}
              >
                <span className={styles.optionName}>{t(`options.${option.id}`)}</span>
                <span className={styles.optionPrice}>{price.option(option)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.extrasBlock}>
        <h3 className={styles.detailHeading}>{t('extrasHeading')}</h3>
        <ul
          className={styles.extras}
          data-testid="extras"
        >
          {PRICING_EXTRAS.map((extra) => (
            <li
              className={styles.extra}
              key={extra.id}
            >
              <span className={styles.extraName}>{t(`extras.${extra.id}.name`)}</span>
              <span className={styles.extraSummary}>{t(`extras.${extra.id}.summary`)}</span>
              <span className={styles.extraPrice}>{price.extra(extra)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
