import { Fragment } from 'react';
import { NOWRAP_PATTERN } from './consts';

/** Текст пункта, где токены вида «152-ФЗ» обернуты в `span` с классом направления (`white-space: nowrap`). */
export const renderNowrap = (text: string, className: string) =>
  text.split(NOWRAP_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <span
        className={className}
        key={`${index}-${part}`}
      >
        {part}
      </span>
    ) : (
      <Fragment key={`${index}-${part}`}>{part}</Fragment>
    ),
  );
