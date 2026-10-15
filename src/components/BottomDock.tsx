import styles from './BottomDock.module.scss';
import type { BottomDockProps } from './types';

export const BottomDock = ({ children }: BottomDockProps) => <div className={styles.dock}>{children}</div>;
