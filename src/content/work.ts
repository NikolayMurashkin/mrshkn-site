/** Сколько метрик видно на карточке кейса; на странице кейса — все. */
export const CARD_METRICS_LIMIT = 3;

/** Длина описания страницы кейса для поисковиков и шеринга. */
const DESCRIPTION_MAX_LENGTH = 160;

/** Адрес страницы кейса без локали: `Link` из next-intl сам добавит префикс языка. */
export const caseHref = (slug: string) => `/work/${slug}`;

/** Текст из админки: абзацы разделены пустой строкой. */
export const splitParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

/** Начало текста по границе слова, с многоточием, если пришлось обрезать. */
export const excerpt = (text: string, limit: number = DESCRIPTION_MAX_LENGTH) => {
  const flat = text.replace(/\s+/g, ' ').trim();

  if (flat.length <= limit) {
    return flat;
  }

  const cut = flat.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(' ');

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};
