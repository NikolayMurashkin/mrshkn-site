import type { ChangeEvent, FormEvent, RefObject } from 'react';
import type { AUDIT_FIELD_NAMES } from './consts';

/** Поля формы замера: как обращаться, адрес сайта и куда прислать ответ. */
export type AuditFieldName = (typeof AUDIT_FIELD_NAMES)[number];

/** Что не так с полем: пусто или адрес не похож на сайт. */
export type AuditFieldError = 'required' | 'url';

/** `sent` — заявка у нас, форму сменяет блок «заявка у нас»; `error` — не ушла, введенное остается. */
export type AuditStatus = 'idle' | 'sending' | 'sent' | 'error';

/** Пропсы текстового поля формы: верстка направления добавляет только свой класс. */
export type AuditInputProps = {
  id: string;
  name: AuditFieldName;
  value: string;
  maxLength: number;
  autoComplete: string;
  inputMode?: 'url';
  spellCheck?: boolean;
  autoCapitalize?: 'none';
  autoCorrect?: 'off';
  disabled: boolean;
  'data-testid': string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

/** Состояние и действия формы замера: верстка направления только рисует на этом хуке. */
export type UseAudit = {
  /** До гидрации `false`: поля, согласие и кнопка выключены. */
  hydrated: boolean;
  status: AuditStatus;
  consent: boolean;
  trap: string;
  canSend: boolean;
  /** Ссылка «Проверить самому»: отчет теста Google по адресу из формы, без адреса — главная теста. */
  psiHref: string;
  input: (field: AuditFieldName) => AuditInputProps;
  errorOf: (field: AuditFieldName) => AuditFieldError | null;
  errorId: (field: AuditFieldName) => string;
  hintId: (field: AuditFieldName) => string;
  setConsent: (event: ChangeEvent<HTMLInputElement>) => void;
  setTrap: (event: ChangeEvent<HTMLInputElement>) => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  /** Блок «заявка у нас»: получает фокус, когда сменяет форму, — иначе фокус пропал бы вместе с кнопкой. */
  successRef: RefObject<HTMLDivElement | null>;
};
