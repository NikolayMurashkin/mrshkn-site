import { DESIGN_DEFAULT_THEME } from '@/designs/consts';
import type { DesignName } from '@/designs/types';
import { THUMB_LINES } from './consts';
import type { DesignThumbProps } from './types';
import styles from './Brief.module.scss';

/**
 * Миниатюра рисуется токенами чужого направления: блоки `[data-design]` лежат в общем CSS,
 * поэтому атрибуты на этом узле дают его палитру, радиусы и рамки прямо внутри текущего стиля.
 */
export const DesignThumb = ({ design }: DesignThumbProps) => (
  <span
    className={styles.thumb}
    data-design={design}
    data-theme={DESIGN_DEFAULT_THEME[design as DesignName]}
    aria-hidden="true"
  >
    <span className={styles.thumbBar} />
    {THUMB_LINES.map((width, index) => (
      <span
        key={width}
        className={index === 0 ? styles.thumbTitle : styles.thumbLine}
        style={{ width: `${width}%` }}
      />
    ))}
    <span className={styles.thumbButton} />
  </span>
);
