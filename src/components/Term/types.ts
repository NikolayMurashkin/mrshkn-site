import type { ReactNode } from 'react';
import type { GlossaryEntry, TermSegment } from '@/lib/glossary/types';

/** Классы подсказки из CSS-модуля направления: своего CSS у компонента нет. `nowrap` — склейка слова с пунктуацией. */
export type TermClasses = {
  root: string;
  button: string;
  tooltip: string;
  nowrap?: string;
};

export type TermScopeProps = {
  classes: TermClasses;
  children: ReactNode;
};

export type TermsProps = {
  text: string;
  nowrapClassName?: string;
};

export type TermProps = {
  /** Ключ записи словаря. */
  id: string;
  /** Текст подсказки. */
  text: string;
  classes: TermClasses;
  nowrap?: boolean;
  nowrapClassName?: string;
  /** Слово, как оно стоит в тексте. */
  children: ReactNode;
};

/** Как открыта подсказка: наведением мыши, фокусом с клавиатуры или нажатием (держится до закрытия). */
export type TermMode = 'hover' | 'focus' | 'pin';

export type TermOpen = { tipId: string; mode: TermMode };

/** Словарь сообщений и его записи по ключу. */
export type TermGlossary = { glossary: GlossaryEntry[]; entries: ReadonlyMap<string, GlossaryEntry> };

/** Граница секции: словарь, классы направления и чьи слова уже размечены (запись словаря → экземпляр `Terms`). */
export type TermScopeValue = {
  glossary: GlossaryEntry[];
  entries: ReadonlyMap<string, GlossaryEntry>;
  classes: TermClasses;
  claims: Map<string, string>;
};

/** Слитный кусок текста между ломкими пробелами: со словом-подсказкой он уходит в обертку без переноса. */
export type TermRun = { nodes: TermSegment[]; hasTerm: boolean };
