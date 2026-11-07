import { Children, type ReactNode } from 'react';
import { Terms } from './Terms';

/** Текст `t.rich` с подсказками: строки между тегами размечаются `Terms`, сами теги (ссылки, выделения) — как есть. */
export const richTerms = (node: ReactNode, nowrapClassName?: string) =>
  Children.toArray(node).map((child, index) =>
    typeof child === 'string' ? (
      <Terms
        key={`terms-${index}`}
        nowrapClassName={nowrapClassName}
        text={child}
      />
    ) : (
      child
    ),
  );
