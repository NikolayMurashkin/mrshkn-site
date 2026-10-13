import { renderNowrap } from '@/designs/nowrap';
import type { EditorialDashesProps } from './types';
import styles from './Dashes.module.scss';

export const EditorialDashes = ({ items, skipped = false }: EditorialDashesProps) => (
  <ul className={skipped ? `${styles.dashes} ${styles.skipped}` : styles.dashes}>
    {items.map((item) => (
      <li key={item}>{renderNowrap(item, styles.nowrap)}</li>
    ))}
  </ul>
);
