import { DESIGN_LABELS } from '@/designs/consts';
import type { DesignName } from '@/designs/types';
import { BRIEF_ANY_DESIGN } from '@/lib/brief/consts';
import { BRIEF_DESIGN_THUMBS } from './consts';
import { DesignThumb } from './DesignThumb';
import type { DesignChoiceProps } from './types';
import styles from './Brief.module.scss';

export const DesignChoice = ({ selected, onPick, labelOf }: DesignChoiceProps) => (
  <div className={styles.thumbs}>
    {BRIEF_DESIGN_THUMBS.map((design) => (
      <button
        key={design}
        type="button"
        className={styles.thumbChoice}
        data-testid="brief-option"
        data-value={design}
        aria-pressed={selected === design}
        onClick={() => onPick('design', design)}
      >
        <DesignThumb design={design} />
        <span className={styles.thumbName}>{DESIGN_LABELS[design as DesignName]}</span>
      </button>
    ))}
    <button
      type="button"
      className={`${styles.choice} ${styles.anyDesign}`}
      data-testid="brief-option"
      data-value={BRIEF_ANY_DESIGN}
      aria-pressed={selected === BRIEF_ANY_DESIGN}
      onClick={() => onPick('design', BRIEF_ANY_DESIGN)}
    >
      {labelOf(BRIEF_ANY_DESIGN)}
    </button>
  </div>
);
