import { Fragment, isValidElement, type ReactNode } from 'react';
import { STUDIO_EMAIL } from '@/lib/consts';

/** Адрес студии в тексте — ссылка `mailto:`: строка разбирается, массив и `Fragment` — поэлементно, остальные элементы не трогаем. */
export const withEmailLinks = (node: ReactNode): ReactNode => {
  if (Array.isArray(node)) {
    return node.map((child, index) => <Fragment key={index}>{withEmailLinks(child)}</Fragment>);
  }

  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
    return <Fragment key={node.key}>{withEmailLinks(node.props.children)}</Fragment>;
  }

  if (typeof node !== 'string' || !node.includes(STUDIO_EMAIL)) {
    return node;
  }

  return node.split(STUDIO_EMAIL).map((part, index) => (
    <Fragment key={`${index}-${part}`}>
      {index > 0 && (
        <a
          href={`mailto:${STUDIO_EMAIL}`}
          translate="no"
        >
          {STUDIO_EMAIL}
        </a>
      )}
      {part}
    </Fragment>
  ));
};
