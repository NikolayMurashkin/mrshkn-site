import { renderNowrap } from '../nowrap';
import type { KineticReviewDocumentProps } from './types';
import { KINETIC_REVIEW_CLASS as cls } from './consts';

export const KineticReviewDocument = ({
  id,
  text,
  edition,
  more,
  checked,
  onToggle,
  children,
}: KineticReviewDocumentProps) => (
  <article
    className={cls.document}
    aria-labelledby={`review-${id}-title`}
  >
    <h3
      className={cls.documentTitle}
      id={`review-${id}-title`}
    >
      {text.title}
    </h3>
    <p className={cls.edition}>{edition}</p>
    <p className={cls.summary}>{text.summary}</p>
    <details className={cls.details}>
      <summary>{more}</summary>
      <ol className={cls.legal}>
        {text.items.map((item) => (
          <li key={item}>
            <span>{renderNowrap(item, cls.nowrap)}</span>
          </li>
        ))}
      </ol>
    </details>
    <label className={`${cls.check} ${cls.documentCheck}`}>
      <input
        type="checkbox"
        data-testid={`review-${id}`}
        name={id}
        checked={checked}
        onChange={onToggle(id)}
      />
      <span>{text.check}</span>
    </label>
    {children}
  </article>
);
