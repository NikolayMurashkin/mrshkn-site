import { useTranslations } from 'next-intl';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import styles from './Process.module.scss';

export const KineticProcess = () => {
  const t = useTranslations('process');

  return (
    <section
      className={styles.process}
      data-testid="process"
      aria-labelledby="process-heading"
    >
      <div className={styles.promisesBlock}>
        <div className={styles.promisesHead}>
          <h2
            className={styles.heading}
            id="process-heading"
          >
            {t('promisesHeading')}
          </h2>
          <p className={styles.note}>{t('contractNote')}</p>
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
      </div>

      <h3 className={styles.stepsHeading}>{t('heading')}</h3>
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
            <span className={styles.day}>{step.day}</span>
            <span className={styles.stepTitle}>{t(`steps.${step.id}.title`)}</span>
            <span className={styles.stepText}>{t(`steps.${step.id}.text`)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};
