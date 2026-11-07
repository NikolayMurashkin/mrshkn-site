import { TermScope, termClasses } from '@/components/Term';
import styles from './Term.module.scss';
import type { EditorialTermScopeProps } from './types';

const classes = termClasses(styles);

/** Граница секции для подсказок Editorial: ставится по каждому `section` и `footer` и по странице целиком. */
export const EditorialTermScope = ({ children }: EditorialTermScopeProps) => (
  <TermScope classes={classes}>{children}</TermScope>
);
