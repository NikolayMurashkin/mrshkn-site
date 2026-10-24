import { useTranslations } from 'next-intl';
import { ProcessScale, processScaleClasses } from '@/components/ProcessScale';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import { SwissSteps } from './Steps';
import styles from './Process.module.scss';

export const SwissProcess = () => {
  const t = useTranslations('process');
  const hero = useTranslations('hero');

  return (
    <section
      className={styles.process}
      data-testid="process"
      id="process"
      aria-labelledby="process-heading"
    >
      <div className={styles.head}>
        <div className={styles.aside}>
          <span
            className={styles.index}
            aria-hidden="true"
          />
          <span className={styles.mark}>{t('sectionMark')}</span>
        </div>
        <div className={styles.titleColumn}>
          <h2
            className={styles.heading}
            id="process-heading"
          >
            {t('promisesHeading')}
          </h2>
          <p className={styles.note}>{t('contractNote')}</p>
        </div>
      </div>

      <div className={styles.body}>
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

        <div className={styles.timeline}>
          <h3 className={styles.subhead}>{t('heading')}</h3>
          <ProcessScale
            classes={processScaleClasses(styles)}
            renderBar={(item) => item.kind === 'day' && item.day}
          />
          <SwissSteps
            steps={PROCESS_STEPS.map((step) => ({
              id: step.id,
              day: step.day,
              label: hero('kinetic.dayUnit'),
              value: String(step.day),
              title: t(`steps.${step.id}.title`),
              text: t(`steps.${step.id}.text`),
            }))}
            testId="steps"
            titleTag="span"
          />
        </div>
      </div>
    </section>
  );
};
