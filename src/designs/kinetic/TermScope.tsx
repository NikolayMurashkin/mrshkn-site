import { TermScope, termClasses } from '@/components/Term';
import styles from './Term.module.scss';
import type { KineticTermScopeProps } from './types';

const classes = termClasses(styles);

/** Граница секции для подсказок Kinetic: ставится по каждому `section` и `footer` и по странице целиком. */
export const KineticTermScope = ({ children }: KineticTermScopeProps) => (
  <TermScope classes={classes}>{children}</TermScope>
);
