'use client';

import { useContext, useEffect, useId, type ReactNode } from 'react';
import { segmentTerms } from '@/lib/glossary';
import type { TermSegment } from '@/lib/glossary/types';
import { TERM_NO_GLOSSARY, TERM_NONBREAKING_SPACES } from './consts';
import { TermScopeContext } from './context';
import { Term } from './Term';
import type { TermRun, TermScopeValue, TermsProps } from './types';

const isBreak = (char: string) => /\s/u.test(char) && !TERM_NONBREAKING_SPACES.includes(char);

/** Текст по кускам, где строка может рваться: обычный пробел — свой кусок, между ними — слитные куски. */
const splitBreaks = (value: string) => {
  const parts: { value: string; isBreak: boolean }[] = [];

  for (const char of value) {
    const last = parts.at(-1);
    const breaks = isBreak(char);

    if (last && last.isBreak === breaks) {
      last.value += char;
    } else {
      parts.push({ value: char, isBreak: breaks });
    }
  }

  return parts;
};

/**
 * Разметка с учетом секции: записи, размеченные другими экземплярами `Terms` секции, уже заняты. Свои — нет: двойной
 * рендер `StrictMode`, гидратация и повторная отрисовка дают тот же результат.
 */
const claim = (scope: TermScopeValue, owner: string, text: string) => {
  const used = new Set([...scope.claims].filter(([, by]) => by !== owner).map(([id]) => id));
  const segments = segmentTerms(text, scope.glossary, used);
  const own = new Set(segments.flatMap((segment) => (segment.kind === 'term' ? [segment.id] : [])));

  for (const [id, by] of scope.claims) {
    if (by === owner && !own.has(id)) {
      scope.claims.delete(id);
    }
  }

  own.forEach((id) => scope.claims.set(id, owner));

  return { segments, own };
};

/** Слитные куски с подсказкой — в одну обертку без переноса: кнопку браузер рисует атомарной, «(» и «—» не отрываются. */
const runsOf = (segments: TermSegment[]) => {
  const runs: (TermRun | string)[] = [];
  let run: TermRun | null = null;

  const flush = () => {
    if (run) {
      runs.push(run);
      run = null;
    }
  };

  for (const segment of segments) {
    const parts =
      segment.kind === 'text' ? splitBreaks(segment.value) : [{ value: segment.value, isBreak: false, segment }];

    for (const part of parts) {
      if (part.isBreak) {
        flush();
        runs.push(part.value);
      } else {
        const node = 'segment' in part ? part.segment : ({ kind: 'text', value: part.value } as const);

        run ??= { nodes: [], hasTerm: false };
        run.nodes.push(node);
        run.hasTerm ||= node.kind === 'term';
      }
    }
  }

  flush();

  return runs;
};

/** Соседние строки — одной строкой: React не разделяет их комментариями, разметка совпадает с исходным текстом. */
const merge = (nodes: (ReactNode | string)[]) =>
  nodes.reduce<(ReactNode | string)[]>((acc, node) => {
    const last = acc.at(-1);

    if (typeof node === 'string' && typeof last === 'string') {
      acc[acc.length - 1] = last + node;
    } else {
      acc.push(node);
    }

    return acc;
  }, []);

/**
 * Текст секции с подсказками: у первого вхождения слова словаря в секции — `Term`, токены «152-ФЗ» — без переноса.
 * Вне `TermScope` или без словаря (английский) — текст как есть, с обертками токенов.
 */
export const Terms = ({ text, nowrapClassName }: TermsProps) => {
  const scope = useContext(TermScopeContext);
  const owner = useId();
  const result = scope ? claim(scope, owner, text) : null;
  const ownIds = result ? [...result.own].join(' ') : '';

  useEffect(() => {
    if (!scope || ownIds === '') {
      return;
    }

    const ids = ownIds.split(' ');

    ids.forEach((id) => {
      if (!scope.claims.has(id)) {
        scope.claims.set(id, owner);
      }
    });

    return () => {
      ids.forEach((id) => {
        if (scope.claims.get(id) === owner) {
          scope.claims.delete(id);
        }
      });
    };
  }, [scope, owner, ownIds]);

  const segments = result?.segments ?? segmentTerms(text, TERM_NO_GLOSSARY, new Set());

  const render = (segment: TermSegment, key: number): ReactNode | string => {
    if (segment.kind === 'text') {
      return segment.value;
    }

    if (segment.kind === 'nowrap') {
      return (
        <span
          className={nowrapClassName}
          key={key}
        >
          {segment.value}
        </span>
      );
    }

    const entry = scope?.entries.get(segment.id);

    return entry && scope ? (
      <Term
        classes={scope.classes}
        id={segment.id}
        key={key}
        nowrap={segment.nowrap}
        nowrapClassName={nowrapClassName ?? scope.classes.nowrap}
        text={entry.text}
      >
        {segment.value}
      </Term>
    ) : (
      segment.value
    );
  };

  if (!result || result.own.size === 0) {
    return <>{merge(segments.map(render))}</>;
  }

  let key = 0;
  const nodes = runsOf(segments).map((run) => {
    if (typeof run === 'string') {
      return run;
    }

    const children = merge(run.nodes.map((node) => render(node, key++)));

    if (!run.hasTerm || run.nodes.length === 1) {
      return children;
    }

    return (
      <span
        className={scope?.classes.nowrap}
        key={key++}
      >
        {children}
      </span>
    );
  });

  return <>{merge(nodes.flat())}</>;
};
