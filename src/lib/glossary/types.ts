/** Запись словаря подсказок: `id` — ключ в `glossary` из `messages/ru.json`, `forms` — как слово ищется в тексте. */
export type GlossaryEntry = { id: string; word: string; forms: string[]; text: string };

/** Кусок текста после разметки: обычный текст, токен без переноса («152-ФЗ») или слово с подсказкой. */
export type TermSegment =
  | { kind: 'text'; value: string }
  | { kind: 'nowrap'; value: string }
  | { kind: 'term'; id: string; value: string; nowrap: boolean };

/** Прямоугольник слова в координатах окна. */
export type TooltipAnchor = { left: number; right: number; top: number; bottom: number };

export type TooltipSize = { width: number; height: number };

export type PlaceTooltipParams = { anchor: TooltipAnchor; tip: TooltipSize; viewport: TooltipSize };

/** Где встает подсказка (`position: fixed`): координаты окна, сторона от слова и предельная ширина. */
export type TooltipPlacement = { left: number; top: number; side: 'top' | 'bottom'; maxWidth: number };
