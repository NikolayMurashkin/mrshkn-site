import type { PopChoicesProps } from './types';
import styles from './PopBrief.module.scss';

export const PopChoices = ({ field, values, selected, labelOf, onPick, disabled }: PopChoicesProps) => (
  <div className={styles.choices}>
    {values.map((value) => (
      <button
        key={value}
        type="button"
        className={styles.choice}
        data-testid="brief-option"
        data-value={value}
        aria-pressed={selected === value}
        disabled={disabled}
        onClick={() => onPick(field, value)}
      >
        {labelOf(value)}
      </button>
    ))}
  </div>
);
