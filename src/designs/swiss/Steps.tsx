import { createElement } from 'react';
import { Terms } from '@/components/Term';
import { SWISS_STEP_TEXT_TAGS } from './consts';
import type { SwissStepsProps } from './types';
import styles from './Steps.module.scss';

export const SwissSteps = ({ steps, testId, titleTag, narrow = false }: SwissStepsProps) => (
  <ol
    className={narrow ? `${styles.steps} ${styles.narrow}` : styles.steps}
    data-testid={testId}
  >
    {steps.map((step) => (
      <li
        className={styles.step}
        data-day={step.day}
        key={step.id}
      >
        <span className={styles.when}>
          {step.value === null ? (
            <span className={styles.words}>
              <Terms text={step.label} />
            </span>
          ) : (
            <>
              {step.label ? (
                <span className={styles.kicker}>
                  <Terms text={step.label} />
                </span>
              ) : null}
              <span className={styles.numeral}>
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
        {createElement(SWISS_STEP_TEXT_TAGS[titleTag], { className: styles.text }, <Terms text={step.text} />)}
      </li>
    ))}
  </ol>
);
