import type { SwissChoicesProps } from './types';
import styles from './SwissBrief.module.scss';

export const SwissChoices = ({ field, values, selected, labelOf, onPick, disabled }: SwissChoicesProps) => (
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
