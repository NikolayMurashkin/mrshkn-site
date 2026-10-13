import { renderNowrap } from '@/designs/nowrap';
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
        {renderNowrap(item, styles.nowrap)}
      </li>
    ))}
  </ul>
);
