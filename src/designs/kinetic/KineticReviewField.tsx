import { useTranslations } from 'next-intl';
import { REVIEW_MAX_LENGTH, REVIEW_TEST_IDS } from '@/components/Review/consts';
import type { KineticReviewFieldProps } from './types';
import { KINETIC_REVIEW_CLASS as cls } from './consts';

export const KineticReviewField = ({
  name,
  label,
  review,
  hint,
  multiline = false,
  type = 'text',
  autoComplete = 'off',
}: KineticReviewFieldProps) => {
  const t = useTranslations('review');
  const error = review.errorOf(name);
  const hintId = `review-${name}-hint`;
  const errorId = `review-${name}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  const control = {
    'data-testid': REVIEW_TEST_IDS[name],
    name,
    autoComplete,
    maxLength: REVIEW_MAX_LENGTH[name],
    value: review.values[name],
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    onChange: review.write(name),
    onBlur: review.touch(name),
  };

  return (
    <label className={cls.field}>
      <span className={cls.label}>{label}</span>
      {multiline ? (
        <textarea
          className={cls.textarea}
          rows={5}
          {...control}
        />
      ) : (
        <input
          className={cls.input}
          type={type}
          spellCheck={type === 'url' ? false : undefined}
          {...control}
        />
      )}
      {hint ? (
        <span
          className={cls.hint}
          id={hintId}
        >
          {hint}
        </span>
      ) : null}
      {error ? (
        <span
          className={cls.fieldError}
          id={errorId}
        >
          {error === 'link' ? t('linkError') : t('fieldError')}
        </span>
      ) : null}
    </label>
  );
};
