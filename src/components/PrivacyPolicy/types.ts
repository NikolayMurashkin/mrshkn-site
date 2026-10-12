import type { PRIVACY_SECTIONS } from './consts';

export type PrivacySectionId = (typeof PRIVACY_SECTIONS)[number];

/** Текст раздела в переводах: абзацы и, если есть, список после них. */
export type PrivacySectionText = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

/** Раздел политики для верстки: `anchor` — id заголовка, `choice` — нужна ли в конце кнопка «Изменить выбор». */
export type PrivacySection = PrivacySectionText & {
  id: PrivacySectionId;
  anchor: string;
  items: string[];
  choice: boolean;
};

/** Данные страницы политики, общие для пяти направлений. */
export type UsePrivacyPolicy = {
  kicker: string;
  title: string;
  updated: string;
  tocLabel: string;
  changeChoice: string;
  sections: PrivacySection[];
  anchors: string[];
  reopen: () => void;
};
