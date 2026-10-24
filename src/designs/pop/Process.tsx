import { useTranslations } from 'next-intl';
import { ProcessScale, processScaleClasses } from '@/components/ProcessScale';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import { POP_SCALE_SWATCHES } from './consts';
import { PopSteps } from './Steps';
import styles from './Process.module.scss';

export const PopProcess = () => {
  const t = useTranslations('process');
  const hero = useTranslations('hero');
  const steps = PROCESS_STEPS.map((step) => ({
    id: step.id,
    day: step.day,
    label: hero('kinetic.dayUnit'),
    value: String(step.day),
    title: t(`steps.${step.id}.title`),
    text: t(`steps.${step.id}.text`),
  }));

  return (
    <section
      className={styles.process}
      data-testid="process"
      id="process"
      aria-labelledby="process-heading"
    >
      <div className={styles.head}>
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

      <h3 className={styles.subhead}>{t('heading')}</h3>

      <ProcessScale
        classes={processScaleClasses(styles)}
        renderBar={(item) => {
          if (item.kind === 'day') {
            return <span className={styles.scaleChip}>{item.day}</span>;
          }

          if (item.kind === 'style') {
            return (
              <span className={styles.scaleSwatches}>
                {POP_SCALE_SWATCHES.map((swatch) => (
                  <span
                    className={styles[swatch]}
                    key={swatch}
                  />
                ))}
              </span>
            );
          }

          return <span className={styles.scaleStop}>{t('scale.pop.stop')}</span>;
        }}
      />

      <PopSteps
        steps={steps}
        testId="steps"
        titleTag="span"
      />
    </section>
  );
};
