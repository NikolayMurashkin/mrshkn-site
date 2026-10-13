import { renderNowrap } from '@/designs/nowrap';
import type { PopChecksProps } from './types';
import styles from './Checks.module.scss';

export const PopChecks = ({ items, inheritColor = false }: PopChecksProps) => (
  <ul className={inheritColor ? `${styles.checks} ${styles.inherit}` : styles.checks}>
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
