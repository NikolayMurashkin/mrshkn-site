import { CheckIcon } from './icons';
import type { KineticChoicesProps } from './types';
import styles from './KineticBrief.module.scss';

export const KineticChoices = ({ field, values, selected, labelOf, onPick, disabled }: KineticChoicesProps) => (
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
        {selected === value ? <CheckIcon /> : null}
        {labelOf(value)}
      </button>
    ))}
  </div>
);
