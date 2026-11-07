import { Terms } from '@/components/Term';
import type { SectionHeadProps } from './types';
import styles from './SectionHead.module.scss';

export const SectionHead = ({ id, kicker, title, note, level = 'h2' }: SectionHeadProps) => {
  const Heading = level;

  return (
    <div className={styles.head}>
      <div className={styles.title}>
        {kicker ? (
          <p className={styles.kicker}>
            <Terms text={kicker} />
          </p>
        ) : null}
        <Heading
          className={styles.heading}
          id={id}
        >
          {title}
        </Heading>
      </div>
      {note ? (
        <p className={styles.note}>
          <Terms text={note} />
        </p>
      ) : null}
    </div>
  );
};
