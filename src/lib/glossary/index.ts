import { NOWRAP_PATTERN } from '@/designs/consts';
import type { GlossaryEntry, TermSegment } from './types';

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

const SENTENCE_END = /[.!?…]+(?=\s|$)/gu;

const LAST_SENTENCE_END = /[.!?…]$/u;

const WORD_CHAR = /[\p{L}\p{N}-]/u;

const NOWRAP_TOKENS = new RegExp(NOWRAP_PATTERN.source, `${NOWRAP_PATTERN.flags.replace('g', '')}g`);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEntry = (value: unknown): value is Omit<GlossaryEntry, 'id'> =>
  isRecord(value) &&
  typeof value.word === 'string' &&
  typeof value.text === 'string' &&
  Array.isArray(value.forms) &&
  value.forms.every((form) => typeof form === 'string');

/** Записи словаря подсказок из `messages.glossary` в порядке ключей; ключа нет или он не объект — пустой словарь. */
export const readGlossary = (messages: unknown): GlossaryEntry[] => {
  const glossary = isRecord(messages) ? messages.glossary : undefined;

  if (!isRecord(glossary)) {
    return [];
  }

  return Object.entries(glossary).flatMap(([id, value]) =>
    isEntry(value) ? [{ id, word: value.word, forms: [...value.forms], text: value.text }] : [],
  );
};

/** Число предложений: конец — `.`, `!`, `?` или `…` перед пробелом или концом строки; текст без такого конца — одно. */
export const countSentences = (text: string): number => {
  const trimmed = text.trim();

  if (trimmed === '') {
    return 0;
  }

  const ends = trimmed.match(SENTENCE_END)?.length ?? 0;

  return LAST_SENTENCE_END.test(trimmed) ? ends : ends + 1;
};

const formKey = (form: string) => form.replace(/\s+/gu, ' ').toLowerCase();

type Matcher = { pattern: RegExp; ids: Map<string, string> };

const matchers = new WeakMap<GlossaryEntry[], Matcher>();

/** Одно выражение на словарь: формы от длинной к короткой — на одной позиции совпадает самая длинная. */
const matcherOf = (glossary: GlossaryEntry[]): Matcher => {
  const cached = matchers.get(glossary);

  if (cached) {
    return cached;
  }

  const ids = new Map(glossary.flatMap((entry) => entry.forms.map((form) => [formKey(form), entry.id] as const)));
  const alternatives = [...new Set(glossary.flatMap((entry) => entry.forms))]
    .sort((a, b) => b.length - a.length)
    .map((form) => form.replace(ESCAPE, '\\$&').replace(/ /g, '\\s'));
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}-])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}-])`, 'giu');
  const matcher = { pattern, ids };

  matchers.set(glossary, matcher);

  return matcher;
};

type Span = { start: number; end: number; segment: TermSegment };

const isWholeWord = (text: string, start: number, end: number) =>
  !WORD_CHAR.test(text.charAt(start - 1)) && !WORD_CHAR.test(text.charAt(end));

/**
 * Текст по кускам: слова словаря (только первое вхождение записи, которой нет в `used`; `id` сразу попадает в `used`),
 * токены без переноса («152-ФЗ») и обычный текст между ними. Склейка `value` кусков — исходный текст.
 */
export const segmentTerms = (text: string, glossary: GlossaryEntry[], used: Set<string>): TermSegment[] => {
  if (text === '') {
    return [];
  }

  const matcher = glossary.length > 0 ? matcherOf(glossary) : null;
  const spans: Span[] = [];

  for (const match of text.matchAll(NOWRAP_TOKENS)) {
    const start = match.index;
    const end = start + match[0].length;
    const id = matcher?.ids.get(formKey(match[0]));

    if (id !== undefined && !used.has(id) && isWholeWord(text, start, end)) {
      used.add(id);
      spans.push({ start, end, segment: { kind: 'term', id, value: match[0], nowrap: true } });
    } else {
      spans.push({ start, end, segment: { kind: 'nowrap', value: match[0] } });
    }
  }

  if (matcher) {
    const tokens = [...spans];

    for (const match of text.matchAll(matcher.pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      const id = matcher.ids.get(formKey(match[0]));

      if (id !== undefined && !used.has(id) && tokens.every((token) => end <= token.start || start >= token.end)) {
        used.add(id);
        spans.push({ start, end, segment: { kind: 'term', id, value: match[0], nowrap: false } });
      }
    }
  }

  spans.sort((a, b) => a.start - b.start);

  const segments: TermSegment[] = [];
  let cursor = 0;

  for (const span of spans) {
    if (span.start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, span.start) });
    }

    segments.push(span.segment);
    cursor = span.end;
  }

  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }

  return segments;
};
