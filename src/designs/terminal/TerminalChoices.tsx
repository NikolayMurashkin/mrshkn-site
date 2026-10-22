import type { TerminalChoicesProps } from './types';
import styles from './TerminalBrief.module.scss';

export const TerminalChoices = ({ field, values, selected, labelOf, onPick, disabled }: TerminalChoicesProps) => (
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
