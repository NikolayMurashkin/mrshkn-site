import { Terms } from '@/components/Term';
import type { SwissChecksProps } from './types';
import styles from './Checks.module.scss';

export const SwissChecks = ({ items, skipped = false }: SwissChecksProps) => (
  <ul className={skipped ? `${styles.checks} ${styles.skipped}` : styles.checks}>
    {items.map((item) => (
      <li
        className={styles.check}
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
