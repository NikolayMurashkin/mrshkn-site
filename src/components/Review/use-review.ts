'use client';

import { useLocale } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { REVIEW_API_HREF } from '@/lib/review/consts';
import { isReviewLink } from '@/lib/review/parse';
import { REVIEW_EMPTY_VALUES, REVIEW_FIELD_NAMES, REVIEW_REQUIRED } from './consts';
import type {
  ReviewCheckName,
  ReviewFieldError,
  ReviewFieldName,
  ReviewFormStatus,
  ReviewProps,
  UseReview,
} from './types';

const fieldErrorOf = (field: ReviewFieldName, value: string): ReviewFieldError | null => {
  const trimmed = value.trim();

  if (REVIEW_REQUIRED.includes(field) && !trimmed) {
    return 'required';
  }

  return field === 'link' && trimmed && !isReviewLink(trimmed) ? 'link' : null;
};

/**
 * Форма отзыва по личной ссылке. Без обеих отметок отзыв не уходит даже событием формы, не только выключенной
 * кнопкой. Ответ «использован» (409) значит, что отзыв уже у нас, — человек видит «отзыв получен», а не ошибку.
 */
export const useReview = ({ view: initialView, code }: Pick<ReviewProps, 'view' | 'code'>): UseReview => {
  const locale = useLocale();
  const [view, setView] = useState(initialView);
  const [values, setValues] = useState(REVIEW_EMPTY_VALUES);
  const [touched, setTouched] = useState<readonly ReviewFieldName[]>([]);
  const [checks, setChecks] = useState<Record<ReviewCheckName, boolean>>({
    consent: false,
    license: false,
    noTransfer: false,
    noLink: false,
  });
  const [status, setStatus] = useState<ReviewFormStatus>('idle');

  const canSend = checks.consent && checks.license && status !== 'sending';

  const errorOf = (field: ReviewFieldName) => (touched.includes(field) ? fieldErrorOf(field, values[field]) : null);

  const write: UseReview['write'] = (field) => (event) =>
    setValues((state) => ({ ...state, [field]: event.target.value }));

  const touch: UseReview['touch'] = (field) => () =>
    setTouched((fields) => (fields.includes(field) ? fields : [...fields, field]));

  const toggle: UseReview['toggle'] = (check) => (event) =>
    setChecks((state) => ({ ...state, [check]: event.target.checked }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!checks.consent || !checks.license || status === 'sending') {
      return;
    }

    setTouched(REVIEW_FIELD_NAMES);

    const invalid = REVIEW_FIELD_NAMES.find((field) => fieldErrorOf(field, values[field]));

    if (invalid) {
      setStatus('fields');
      (event.currentTarget.elements.namedItem(invalid) as HTMLElement | null)?.focus();

      return;
    }

    setStatus('sending');

    try {
      const response = await fetch(REVIEW_API_HREF, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code,
          locale,
          fullName: values.fullName,
          signature: values.signature,
          occupation: values.occupation,
          link: values.link,
          answers: { before: values.before, process: values.process, after: values.after },
          consent: checks.consent,
          license: checks.license,
          restrictions: { noTransfer: checks.noTransfer, noLink: checks.noLink, other: values.other },
        }),
      });

      if (response.ok || response.status === 409) {
        setView('received');

        return;
      }

      if (response.status === 404) {
        setView('invalid');

        return;
      }

      setStatus(response.status === 400 ? 'fields' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return { view, values, checks, status, canSend, errorOf, write, touch, toggle, submit };
};
