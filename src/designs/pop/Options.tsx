import type { PopOptionsProps } from './types';
import styles from './Options.module.scss';

export const PopOptions = ({ items, testId, narrow = false }: PopOptionsProps) => (
  <ul
    className={narrow ? `${styles.pricelist} ${styles.narrow}` : styles.pricelist}
    data-testid={testId}
  >
    {items.map((item) => (
      <li
        className={styles.option}
        key={item.id}
      >
        <span className={styles.name}>{item.name}</span>
        <span
          className={styles.dots}
          aria-hidden="true"
        />
        <span
          className={styles.price}
          data-testid="option-price"
        >
          {item.amount}
        </span>
        <span className={styles.note}>{item.note}</span>
      </li>
    ))}
  </ul>
);
