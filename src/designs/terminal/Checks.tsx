import { Terms } from '@/components/Term';
import type { TerminalChecksProps } from './types';
import styles from './Checks.module.scss';

export const TerminalChecks = ({ items, skipped = false }: TerminalChecksProps) => (
  <ul className={styles.checks}>
    {items.map((item) => (
      <li
        className={skipped ? `${styles.check} ${styles.skipped}` : styles.check}
        key={item}
      >
        <Terms
          text={item}
          nowrapClassName={styles.nowrap}
        />
      </li>
    ))}
  </ul>
);
