import type { ChoicesProps } from './types';
import styles from './Brief.module.scss';

export const Choices = ({ field, values, selected, labelOf, onPick }: ChoicesProps) => (
  <div className={styles.choices}>
    {values.map((value) => (
      <button
        key={value}
        type="button"
        className={styles.choice}
        data-testid="brief-option"
        data-value={value}
        aria-pressed={selected === value}
        onClick={() => onPick(field, value)}
      >
        {labelOf(value)}
      </button>
    ))}
  </div>
);
