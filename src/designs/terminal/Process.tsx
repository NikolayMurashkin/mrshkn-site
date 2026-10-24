import { useTranslations } from 'next-intl';
import { ProcessScale, processScaleClasses } from '@/components/ProcessScale';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import { TERMINAL_SCALE_PAUSE } from './consts';
import { TerminalSteps } from './Steps';
import styles from './Process.module.scss';

export const TerminalProcess = () => {
  const t = useTranslations('process');
  const steps = PROCESS_STEPS.map((step, index) => ({
    id: step.id,
    day: step.day,
    label: t('stepLabel', { index: String(index + 1).padStart(2, '0'), day: step.day }),
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
        <p className={styles.note}>
          <span
            className={styles.prompt}
            aria-hidden="true"
          >
            {'//'}
          </span>{' '}
          {t('contractNote')}
        </p>
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

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>{t('heading')}</h3>
        <ProcessScale
          classes={processScaleClasses(styles)}
          renderBar={(item) =>
            item.kind === 'day'
              ? t('scale.terminal.day', { day: String(item.day).padStart(2, '0') })
              : item.kind === 'pause'
                ? TERMINAL_SCALE_PAUSE
                : t('scale.terminal.styles')
          }
        />

        <TerminalSteps
          steps={steps}
          testId="steps"
          titleTag="span"
        />
      </div>
    </section>
  );
};
