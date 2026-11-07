import { createElement } from 'react';
import { Terms } from '@/components/Term';
import type { TerminalStepsProps } from './types';
import styles from './Steps.module.scss';

export const TerminalSteps = ({ steps, testId, titleTag, narrow = false }: TerminalStepsProps) => (
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
        <span className={styles.label}>
          <Terms text={step.label} />
        </span>
        {createElement(
          titleTag,
          { className: styles.title },
          titleTag === 'span' ? <Terms text={step.title} /> : step.title,
        )}
        <span className={styles.text}>
          <Terms text={step.text} />
        </span>
      </li>
    ))}
  </ol>
);
