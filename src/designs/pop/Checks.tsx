import { Terms } from '@/components/Term';
import type { PopChecksProps } from './types';
import styles from './Checks.module.scss';

export const PopChecks = ({ items, inheritColor = false, skipped = false }: PopChecksProps) => (
  <ul
    className={[styles.checks, inheritColor ? styles.inherit : null, skipped ? styles.skipped : null]
      .filter(Boolean)
      .join(' ')}
  >
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
