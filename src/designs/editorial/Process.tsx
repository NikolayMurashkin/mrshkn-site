import { useTranslations } from 'next-intl';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import { useProcessCards } from '@/components/use-process-cards';
import { EditorialProcessCards } from './ProcessCards';
import { EditorialRubric } from './Rubric';
import styles from './Process.module.scss';

export const EditorialProcess = () => {
  const t = useTranslations('process');
  const cards = useProcessCards();

  return (
    <section
      className={styles.process}
      data-testid="process"
      id="process"
      aria-labelledby="process-heading"
    >
      <div className={styles.head}>
        <EditorialRubric
          label={t('sectionMark')}
          note={t('contractNote')}
        />
        <h2
          className={styles.title}
          id="process-heading"
        >
          {t('promisesHeading')}
        </h2>
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

      {cards.prestart ? <EditorialProcessCards block={cards.prestart} /> : null}

      <h3 className={styles.subhead}>{t('heading')}</h3>

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
            <span
              className={styles.day}
              aria-hidden="true"
            >
              {step.day}
            </span>
            <p className={styles.text}>
              <span className={styles.ordinal}>{t(`steps.${step.id}.ordinal`)}.</span>{' '}
              <span className={styles.stepTitle}>{t(`steps.${step.id}.title`)}.</span> {t(`steps.${step.id}.text`)}
            </p>
          </li>
        ))}
      </ol>

      {cards.after ? <EditorialProcessCards block={cards.after} /> : null}
    </section>
  );
};
