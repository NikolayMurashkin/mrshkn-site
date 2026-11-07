import { createElement } from 'react';
import { Terms } from '@/components/Term';
import { POP_STEP_TEXT_TAGS, POP_STEP_TONES } from './consts';
import type { PopStepsProps } from './types';
import styles from './Steps.module.scss';

export const PopSteps = ({ steps, testId, titleTag, narrow = false }: PopStepsProps) => (
  <ol
    className={narrow ? `${styles.steps} ${styles.narrow}` : styles.steps}
    data-testid={testId}
  >
    {steps.map((step, index) => (
      <li
        className={styles.step}
        data-day={step.day}
        key={step.id}
      >
        <span
          className={[
            styles.day,
            step.value === null ? styles.dayWords : null,
            styles[`tone${POP_STEP_TONES[index % POP_STEP_TONES.length]}`],
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {step.value === null ? (
            <span className={styles.dayText}>
              <Terms text={step.label} />
            </span>
          ) : (
            <>
              {step.label ? (
                <span className={styles.dayLabel}>
                  <Terms text={step.label} />
                </span>
              ) : null}
              <span className={styles.dayNum}>
                <Terms text={step.value} />
              </span>
            </>
          )}
        </span>
        {createElement(
          titleTag,
          { className: styles.title },
          titleTag === 'span' ? <Terms text={step.title} /> : step.title,
        )}
        {createElement(POP_STEP_TEXT_TAGS[titleTag], { className: styles.text }, <Terms text={step.text} />)}
      </li>
    ))}
  </ol>
);
