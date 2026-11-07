import { Terms } from '@/components/Term';
import type { EditorialRubricProps } from './types';
import styles from './Rubric.module.scss';

export const EditorialRubric = ({ label, note }: EditorialRubricProps) => (
  <div className={styles.rubric}>
    <span className={styles.label}>
      <Terms text={label} />
    </span>
    <span
      className={styles.rule}
      aria-hidden="true"
    />
    {note ? (
      <span className={styles.note}>
        <Terms text={note} />
      </span>
    ) : null}
  </div>
);
