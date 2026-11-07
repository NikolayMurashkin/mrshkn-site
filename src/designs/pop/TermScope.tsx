import { TermScope, termClasses } from '@/components/Term';
import styles from './Term.module.scss';
import type { PopTermScopeProps } from './types';

const classes = termClasses(styles);

/** Граница секции для подсказок Pop: ставится по каждому `section` и `footer` и по странице целиком. */
export const PopTermScope = ({ children }: PopTermScopeProps) => <TermScope classes={classes}>{children}</TermScope>;
