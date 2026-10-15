import type { ChangeEvent, FormEvent } from 'react';
import type { ReviewView } from '@/lib/review/types';

/** Пропсы секции отзыва: вид по состоянию кода, сам код и название проекта для формы. */
export type ReviewProps = {
  view: ReviewView;
  code: string;
  project?: string;
};

/** Текстовые поля формы: три о себе, ссылка, три ответа и «другое» из запретов. */
export type ReviewFieldName =
  'fullName' | 'signature' | 'occupation' | 'link' | 'before' | 'process' | 'after' | 'other';

/** Отметки формы: два документа и два запрета. */
export type ReviewCheckName = 'consent' | 'license' | 'noTransfer' | 'noLink';

/** Что не так с полем: пусто или ссылка не http(s). */
export type ReviewFieldError = 'required' | 'link';

/** `fields` — сервер или проверка формы нашли незаполненное поле, `error` — отзыв не ушел. */
export type ReviewFormStatus = 'idle' | 'sending' | 'fields' | 'error';

/** Состояние и действия формы отзыва: верстка направления только рисует на этом хуке. */
export type UseReview = {
  view: ReviewView;
  values: Record<ReviewFieldName, string>;
  checks: Record<ReviewCheckName, boolean>;
  status: ReviewFormStatus;
  canSend: boolean;
  errorOf: (field: ReviewFieldName) => ReviewFieldError | null;
  write: (field: ReviewFieldName) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  touch: (field: ReviewFieldName) => () => void;
  toggle: (check: ReviewCheckName) => (event: ChangeEvent<HTMLInputElement>) => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};
