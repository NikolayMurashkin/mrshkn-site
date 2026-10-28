import type { EditorialOptionsProps } from './types';
import styles from './Options.module.scss';

export const EditorialOptions = ({ items, testId, narrow = false }: EditorialOptionsProps) => (
  <ul
    className={narrow ? `${styles.options} ${styles.narrow}` : styles.options}
    data-testid={testId}
  >
    {items.map((item) => (
      <li
        className={styles.option}
        key={item.id}
      >
        <span className={styles.line}>
          <span className={styles.name}>{item.name}</span>
          <span
            className={styles.leader}
            aria-hidden="true"
          />
        </span>
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
