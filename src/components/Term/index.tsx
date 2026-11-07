import type { TermClasses } from './types';

export type { TermClasses } from './types';
export { richTerms } from './rich';
export { Term } from './Term';
export { Terms } from './Terms';
export { TermScope } from './TermScope';

/** Классы подсказки из CSS-модуля направления: у всех пяти одни имена с префиксом `term`. */
export const termClasses = (styles: Readonly<Record<string, string>>): TermClasses => ({
  root: styles.term,
  button: styles.termButton,
  tooltip: styles.termTooltip,
  nowrap: styles.termNowrap,
});
