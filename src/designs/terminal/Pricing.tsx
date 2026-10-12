import { useTranslations } from 'next-intl';
import { useGoal } from '@/components/Analytics/use-consent';
import { planPath } from '@/content/format';
import { PRICING_EXTRAS, PRICING_OPTIONS, PRICING_PLANS } from '@/content/pricing';
import { usePriceText } from '@/content/use-price';
import { Link } from '@/i18n/navigation';
import { GOALS } from '@/lib/analytics/consts';
import { TerminalBasics } from './Basics';
import { TerminalOptions } from './Options';
import styles from './Pricing.module.scss';

export const TerminalPricing = () => {
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
        <p className={styles.note}>
          <span
            className={styles.prompt}
            aria-hidden="true"
          >
            {'//'}
          </span>{' '}
          {t('note')}
        </p>
      </div>

      <table
        className={styles.table}
        id="prices"
      >
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
                <Link
                  className={styles.planLink}
                  href={planPath(plan)}
                  onClick={() => reachGoal(GOALS.planClick)}
                  aria-label={t('planLink', { name: t(`plans.${plan.id}.name`) })}
                >
                  {t(`plans.${plan.id}.name`)}
                </Link>
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

      <div className={styles.included}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('basicsHeading')}</h3>
          <p className={styles.blockNote}>{t('basicsNote')}</p>
        </div>
        <TerminalBasics titleTag="h4" />
      </div>

      <div className={styles.optionsBlock}>
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t('optionsHeading')}</h3>
          <p className={styles.blockNote}>{t('optionsNote')}</p>
        </div>
        <TerminalOptions
          items={options}
          testId="options"
        />
      </div>

      <div className={styles.extrasBlock}>
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
