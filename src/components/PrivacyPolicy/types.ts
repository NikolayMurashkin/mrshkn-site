import type { ReactNode } from 'react';
import type { PRIVACY_SECTIONS } from './consts';

export type PrivacySectionId = (typeof PRIVACY_SECTIONS)[number];

/** Текст раздела в переводах: абзацы, список (начало пункта жирным — `<b>…</b>`) и абзацы после списка. */
export type PrivacySectionText = {
  title: string;
  paragraphs: string[];
  items?: string[];
  after?: string[];
};

/** Пункт списка: `key` — исходная строка перевода, `content` — она же с жирным началом. */
export type PrivacySectionItem = {
  key: string;
  content: ReactNode;
};

/** Раздел политики для верстки: `anchor` — id заголовка, `choice` — нужна ли в конце кнопка «Изменить выбор». */
export type PrivacySection = {
  id: PrivacySectionId;
  anchor: string;
  title: string;
  paragraphs: string[];
  items: PrivacySectionItem[];
  after: string[];
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
