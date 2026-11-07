'use client';

import { useMessages } from 'next-intl';
import { useMemo, useState } from 'react';
import { readGlossary } from '@/lib/glossary';
import { TermScopeContext } from './context';
import type { TermGlossary, TermScopeProps } from './types';

const glossaries = new WeakMap<object, TermGlossary>();

/** Словарь из сообщений один на объект сообщений: выражение поиска форм кешируется по этому массиву. */
const glossaryOf = (messages: object): TermGlossary => {
  const cached = glossaries.get(messages);

  if (cached) {
    return cached;
  }

  const glossary = readGlossary(messages);
  const value = { glossary, entries: new Map(glossary.map((entry) => [entry.id, entry])) };

  glossaries.set(messages, value);

  return value;
};

/**
 * Граница секции для правила «подсказка только у первого вхождения»: свой учет размеченных слов и классы `Term`
 * направления. Ставится по каждому `section` и `footer` направления и по странице целиком.
 */
export const TermScope = ({ classes, children }: TermScopeProps) => {
  const messages = useMessages();
  const { glossary, entries } = glossaryOf(messages);
  const [claims] = useState(() => new Map<string, string>());
  const value = useMemo(() => ({ glossary, entries, classes, claims }), [glossary, entries, classes, claims]);

  return <TermScopeContext value={value}>{children}</TermScopeContext>;
};
