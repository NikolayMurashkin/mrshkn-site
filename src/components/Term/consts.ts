import type { GlossaryEntry } from '@/lib/glossary/types';

/** Сколько после касания браузер присылает эмулированные события мыши: наведение в это время не открывает, мс. */
export const TERM_TOUCH_MOUSE_WINDOW = 1000;

/** Пробелы, на которых строка не рвется: склейка слова с соседним текстом идет через них до обычного пробела. */
export const TERM_NONBREAKING_SPACES = [' ', ' ', ' '];

/** Пустой словарь: текст вне `TermScope` режется только на токены без переноса. */
export const TERM_NO_GLOSSARY: GlossaryEntry[] = [];
