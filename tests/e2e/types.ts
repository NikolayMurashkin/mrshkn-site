import type { DESIGNS } from './consts';

/** Признаки направления, по которым тест отличает его шапку и подвал от чужих. */
export type DesignShape = {
  /** Шрифт заголовков: он же шрифт вордмарка в шапке. */
  displayFont: RegExp;
  /** Шрифт основного текста. */
  textFont: RegExp;
  /** Сколько пунктов в меню шапки. */
  navLinks: number;
  /** Текст кнопки в шапке; null — у направления ее нет. */
  headerCta: string | null;
  /** Заголовок hero. */
  heroTitle: RegExp;
  /** Шрифт заголовка hero: у Terminal это текстовый IBM Plex Sans, не моно. */
  heroTitleFont: RegExp;
  /** Главная и вторая кнопки hero. */
  heroCtas: [string, string];
  /** Текст, который есть только в hero этого направления (подпись, промпт, цитата). */
  heroMark: string;
};

/** Имя направления, как оно лежит в cookie `design` и атрибуте `data-design`. */
export type DesignName = (typeof DESIGNS)[number];

/** Запись приемника заявок: в какой канал ушла заявка и что в этом канале оказалось. */
export type SinkCall = {
  channel: 'telegram' | 'bitrix' | 'mail';
  body: string;
};

/** Что переопределяет тест при открытии направления: тема, язык и размер окна. */
export type OpenDesignOptions = {
  theme?: string;
  locale?: string;
  viewport?: { width: number; height: number };
  /** Адрес внутри локали: пусто — главная, `/brief` — квиз. Шапка и подвал живут на каждой странице. */
  path?: string;
};
