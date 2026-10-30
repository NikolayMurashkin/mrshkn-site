import type { PopProcessCardsProps } from './types';
import styles from './ProcessCards.module.scss';

export const PopProcessCards = ({ block, narrow = false }: PopProcessCardsProps) => (
  <div className={narrow ? `${styles.block} ${styles.narrow}` : styles.block}>
    <h3 className={styles.heading}>{block.heading}</h3>
    <ul className={styles.cards}>
      {block.cards.map((card) => (
        <li
          className={styles.card}
          key={card.id}
        >
          <h4 className={styles.title}>{card.title}</h4>
          <p className={styles.text}>{card.text}</p>
        </li>
      ))}
    </ul>
  </div>
);
