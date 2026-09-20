import { useLocale, useTranslations } from 'next-intl';
import { planHref } from '@/content/format';
import { PRICING_BASICS, PRICING_EXTRAS, PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { usePriceText } from '@/content/use-price';
import styles from './Pricing.module.scss';

export const TerminalPricing = () => {
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
        <p className={styles.note}>
          <span className={styles.prompt}>{'//'}</span> {t('note')}
        </p>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th
              className={styles.columnIndex}
              scope="col"
            >
              {t('columns.number')}
            </th>
            <th scope="col">{t('columns.product')}</th>
            <th
              className={styles.columnTerm}
              scope="col"
            >
              {t('columns.term')}
            </th>
            <th
              className={styles.columnPrice}
              scope="col"
            >
              {t('columns.price')}
            </th>
          </tr>
        </thead>
        <tbody>
          {PRICING_PLANS.map((plan, index) => (
            <tr
              data-testid={`plan-${plan.id}`}
              key={plan.id}
            >
              <td className={styles.index}>{String(index + 1).padStart(2, '0')}</td>
              <td>
                <a
                  className={styles.planLink}
                  href={planHref(locale, plan)}
                  aria-label={t('planLink', { name: t(`plans.${plan.id}.name`) })}
                >
                  {t(`plans.${plan.id}.name`)}
                </a>
                <span className={styles.summary}>{t(`plans.${plan.id}.summary`)}</span>
              </td>
              <td className={styles.term}>{t(`plans.${plan.id}.term`)}</td>
              <td className={styles.price}>{price.plan(plan)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className={styles.miniApp}
        data-testid="mini-app-note"
      >
        <p className={styles.miniAppTitle}>
          <span className={styles.prompt}>$</span> {t('miniAppNote.title')}
        </p>
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

      <div className={styles.detail}>
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
