const codePoints = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join('');

// Неразрывный пробел и мягкий перенос: литералами их не видно ни в файле, ни в дифе, а Prettier
// разворачивает escape-последовательности обратно в символы — поэтому только через коды.
const INVISIBLE_MARKS = String.fromCodePoint(0x00a0, 0x00ad);

const BASIC_LATIN = codePoints(0x20, 0x7e);
const LATIN_1_MARKS = '©«®°·»×';
const CYRILLIC = codePoints(0x400, 0x45f);
const PUNCTUATION_AND_SYMBOLS = '–—‘’“”„•…№€₽←→−≤≥✓';

export const GLYPHS = BASIC_LATIN + INVISIBLE_MARKS + LATIN_1_MARKS + CYRILLIC + PUNCTUATION_AND_SYMBOLS;
