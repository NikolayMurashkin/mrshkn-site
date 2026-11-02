'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { AUDIT_API_HREF } from '@/lib/audit/consts';
import { normalizeSiteUrl, psiUrl } from '@/lib/audit/url';
import { HONEYPOT_FIELD } from '@/lib/brief/consts';
import {
  AUDIT_AUTOCOMPLETE,
  AUDIT_EMPTY_VALUES,
  AUDIT_FIELD_NAMES,
  AUDIT_HINT_FIELDS,
  AUDIT_MAX_LENGTH,
} from './consts';
import type { AuditFieldError, AuditFieldName, AuditStatus, UseAudit } from './types';

const subscribe = () => () => {};

const clientSnapshot = () => true;

const serverSnapshot = () => false;

const fieldErrorOf = (field: AuditFieldName, value: string): AuditFieldError | null => {
  if (!value.trim()) {
    return 'required';
  }

  return field === 'url' && normalizeSiteUrl(value) === null ? 'url' : null;
};

/**
 * Форма «Проверьте свой сайт». Без согласия заявка не уходит даже событием формы, не только выключенной кнопкой.
 * Поля, согласие и кнопка до гидрации выключены, как ответы квиза: введенное до нее React не переносит в состояние —
 * текст виден, а форма считает поле пустым; галочка стоит, а кнопка выключена. Признак тот же, что у квиза
 * (сервер `false`, браузер `true`), но свой: общий `useHydrated` импортируют только квизы направлений.
 * До гидрации форма и не уйдет обычной отправкой с контактом в адресе страницы.
 * Пустое поле или адрес не сайта ловятся до запроса — сообщение у поля, фокус на первом таком поле.
 */
export const useAudit = (): UseAudit => {
  const baseId = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [values, setValues] = useState(AUDIT_EMPTY_VALUES);
  const [touched, setTouched] = useState<readonly AuditFieldName[]>([]);
  const [consent, setConsentValue] = useState(false);
  const [trap, setTrapValue] = useState('');
  const [status, setStatus] = useState<AuditStatus>('idle');
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'sent') {
      successRef.current?.focus();
    }
  }, [status]);

  const canSend = hydrated && consent && status !== 'sending';

  const errorOf = (field: AuditFieldName) => (touched.includes(field) ? fieldErrorOf(field, values[field]) : null);

  const errorId = (field: AuditFieldName) => `${baseId}-${field}-error`;

  const hintId = (field: AuditFieldName) => `${baseId}-${field}-hint`;

  const describedBy = (field: AuditFieldName) =>
    [AUDIT_HINT_FIELDS.includes(field) ? hintId(field) : null, errorOf(field) ? errorId(field) : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const touch = (field: AuditFieldName) => () =>
    setTouched((fields) => (fields.includes(field) ? fields : [...fields, field]));

  const input: UseAudit['input'] = (field) => ({
    id: `${baseId}-${field}`,
    name: field,
    value: values[field],
    maxLength: AUDIT_MAX_LENGTH[field],
    autoComplete: AUDIT_AUTOCOMPLETE[field],
    ...(field === 'url' ? { inputMode: 'url' as const, spellCheck: false, autoCapitalize: 'none' as const } : {}),
    ...(field === 'contact' ? { spellCheck: false, autoCapitalize: 'none' as const, autoCorrect: 'off' as const } : {}),
    disabled: !hydrated,
    'data-testid': `audit-${field}`,
    'aria-invalid': errorOf(field) !== null,
    'aria-describedby': describedBy(field),
    onChange: (event) => setValues((state) => ({ ...state, [field]: event.target.value })),
    onBlur: touch(field),
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!consent || status === 'sending') {
      return;
    }

    setTouched(AUDIT_FIELD_NAMES);

    const invalid = AUDIT_FIELD_NAMES.find((field) => fieldErrorOf(field, values[field]));

    if (invalid) {
      (event.currentTarget.elements.namedItem(invalid) as HTMLElement | null)?.focus();

      return;
    }

    setStatus('sending');

    try {
      const response = await fetch(AUDIT_API_HREF, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, consent, [HONEYPOT_FIELD]: trap }),
      });

      setStatus(response.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return {
    hydrated,
    status,
    consent,
    trap,
    canSend,
    psiHref: psiUrl(values.url),
    input,
    errorOf,
    errorId,
    hintId,
    setConsent: (event) => setConsentValue(event.target.checked),
    setTrap: (event) => setTrapValue(event.target.value),
    submit,
    successRef,
  };
};
