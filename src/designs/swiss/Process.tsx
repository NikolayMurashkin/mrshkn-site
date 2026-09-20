import { useTranslations } from 'next-intl';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import styles from './Process.module.scss';

export const SwissProcess = () => {
  const t = useTranslations('process');

  return (
    <section
      className={styles.process}
      data-testid="process"
      aria-labelledby="process-heading"
    >
      <div className={styles.aside}>
        <span className={styles.mark}>{t('sectionMark')}</span>
        <h2
          className={styles.heading}
          id="process-heading"
        >
          {t('promisesHeading')}
        </h2>
        <p className={styles.note}>{t('contractNote')}</p>
      </div>

      <div className={styles.main}>
        <ul
          className={styles.promises}
          data-testid="promises"
        >
          {PROMISES.map((promise) => (
            <li
              className={styles.cell}
              key={promise}
            >
              <span className={styles.kicker}>{t(`promises.${promise}.kicker`)}</span>
              <span className={styles.value}>{t(`promises.${promise}.value`)}</span>
              <span className={styles.detail}>{t(`promises.${promise}.detail`)}</span>
            </li>
          ))}
        </ul>

        <h3 className={styles.stepsHeading}>{t('heading')}</h3>
        <ol
          className={styles.steps}
          data-testid="steps"
        >
          {PROCESS_STEPS.map((step) => (
            <li
              className={styles.cell}
              data-day={step.day}
              key={step.id}
            >
              <span className={styles.kicker}>{t('dayLabel', { day: step.day })}</span>
              <span className={styles.value}>{t(`steps.${step.id}.title`)}</span>
              <span className={styles.detail}>{t(`steps.${step.id}.text`)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
