import { renderNowrap } from '@/designs/nowrap';
import type { SwissChecksProps } from './types';
import styles from './Checks.module.scss';

export const SwissChecks = ({ items, skipped = false }: SwissChecksProps) => (
  <ul className={skipped ? `${styles.checks} ${styles.skipped}` : styles.checks}>
    {items.map((item) => (
      <li
        className={styles.check}
        key={item}
      >
        {renderNowrap(item, styles.nowrap)}
      </li>
    ))}
  </ul>
);
