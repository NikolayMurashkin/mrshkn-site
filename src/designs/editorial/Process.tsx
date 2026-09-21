import { useTranslations } from 'next-intl';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import styles from './Process.module.scss';

export const EditorialProcess = () => {
  const t = useTranslations('process');

  return (
    <section
      className={styles.process}
      data-testid="process"
      id="process"
      aria-labelledby="process-heading"
    >
      <div className={styles.rule}>
        <h2
          className={styles.heading}
          id="process-heading"
        >
          {t('promisesHeading')}
        </h2>
        <span className={styles.note}>{t('contractNote')}</span>
      </div>

      <ul
        className={styles.promises}
        data-testid="promises"
      >
        {PROMISES.map((promise) => (
          <li
            className={styles.promise}
            key={promise}
          >
            <span className={styles.kicker}>{t(`promises.${promise}.kicker`)}</span>
            <span className={styles.value}>{t(`promises.${promise}.value`)}</span>
            <span className={styles.detail}>{t(`promises.${promise}.detail`)}</span>
          </li>
        ))}
      </ul>

      <div className={styles.rule}>
        <h3 className={styles.heading}>{t('heading')}</h3>
      </div>

      <ol
        className={styles.steps}
        data-testid="steps"
      >
        {PROCESS_STEPS.map((step) => (
          <li
            className={styles.step}
            data-day={step.day}
            key={step.id}
          >
            <p className={styles.paragraph}>
              <span className={styles.ordinal}>{t(`steps.${step.id}.ordinal`)}.</span>{' '}
              <span className={styles.stepTitle}>{t(`steps.${step.id}.title`)}.</span> {t(`steps.${step.id}.text`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
};
