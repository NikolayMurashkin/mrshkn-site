import { TermScope, termClasses } from '@/components/Term';
import styles from './Term.module.scss';
import type { TerminalTermScopeProps } from './types';

const classes = termClasses(styles);

/** Граница секции для подсказок Terminal: ставится по каждому `section` и `footer` и по странице целиком. */
export const TerminalTermScope = ({ children }: TerminalTermScopeProps) => (
  <TermScope classes={classes}>{children}</TermScope>
);
