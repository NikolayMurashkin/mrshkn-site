import { TermScope, termClasses } from '@/components/Term';
import styles from './Term.module.scss';
import type { SwissTermScopeProps } from './types';

const classes = termClasses(styles);

/** Граница секции для подсказок Swiss: ставится по каждому `section` и `footer` и по странице целиком. */
export const SwissTermScope = ({ children }: SwissTermScopeProps) => (
  <TermScope classes={classes}>{children}</TermScope>
);
