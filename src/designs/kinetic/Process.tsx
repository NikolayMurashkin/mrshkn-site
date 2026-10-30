import { useTranslations } from 'next-intl';
import { PROCESS_STEPS, PROMISES } from '@/content/process';
import { ProcessScale, processScaleClasses } from '@/components/ProcessScale';
import { useProcessCards } from '@/components/use-process-cards';
import { KineticProcessCards } from './ProcessCards';
import { SectionHead } from './SectionHead';
import styles from './Process.module.scss';

export const KineticProcess = () => {
  const t = useTranslations('process');
  const nav = useTranslations('nav');
  const hero = useTranslations('hero');
  const cards = useProcessCards();

  return (
    <section
      className={styles.process}
      data-testid="process"
      id="process"
      aria-labelledby="process-heading"
    >
      <SectionHead
        id="process-heading"
        kicker={nav('process')}
        title={t('heading')}
        note={t('contractNote')}
      />

      <ul
        className={styles.promises}
        data-testid="promises"
      >
        {PROMISES.map((promise, index) => (
          <li
            className={index === 0 ? `${styles.promise} ${styles.lead}` : styles.promise}
            key={promise}
          >
            <span className={styles.kicker}>{t(`promises.${promise}.kicker`)}</span>
            <span className={styles.value}>{t(`promises.${promise}.value`)}</span>
            <span className={styles.detail}>{t(`promises.${promise}.detail`)}</span>
          </li>
        ))}
      </ul>

      {cards.prestart ? <KineticProcessCards block={cards.prestart} /> : null}

      <ProcessScale
        classes={processScaleClasses(styles)}
        renderBar={(item) => item.kind === 'day' && <span className={styles.scaleNum}>{item.day}</span>}
      />

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
            <span className={styles.day}>
              <span className={styles.num}>{step.day}</span>
              <span className={styles.unit}>{hero('kinetic.dayUnit')}</span>
            </span>
            <span className={styles.stepTitle}>{t(`steps.${step.id}.title`)}</span>
            <span className={styles.stepText}>{t(`steps.${step.id}.text`)}</span>
          </li>
        ))}
      </ol>

      {cards.after ? <KineticProcessCards block={cards.after} /> : null}
    </section>
  );
};
