import type { LEGAL_DOCUMENTS } from './consts';

/** Документ короткого юрпакета, который сайт показывает отдельной страницей. */
export type LegalDocumentId = keyof typeof LEGAL_DOCUMENTS;

/** Кусок строки документа: обычный текст или жирный (`**…**` в исходнике). */
export type LegalInline = { text: string; strong: boolean };

/** Пункты списка: у нумерованного — номер первого пункта, как в исходнике. */
export type LegalList =
  | { type: 'list'; ordered: false; items: LegalInline[][] }
  | { type: 'list'; ordered: true; start: number; items: LegalInline[][] };

/** Блок документа: заголовок документа (`# `), раздела (`## `), абзац или список. */
export type LegalBlock =
  | { type: 'title'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; content: LegalInline[] }
  | LegalList;

/** Раздел страницы документа: заголовок `## ` и блоки до следующего; у вводной части заголовка нет. */
export type LegalSection = {
  heading: string | null;
  blocks: Exclude<LegalBlock, { type: 'title' | 'heading' }>[];
};

/** Блок прошлых редакций под текстом документа. */
export type LegalHistory = { title: string; text: string };

/** Данные страницы документа для верстки направления: заголовок отдельно, остальное — блоками по порядку. */
export type LegalPageProps = {
  kicker: string;
  title: string;
  blocks: LegalBlock[];
  history?: LegalHistory;
};

/** Параметры адреса страницы документа. */
export type LegalRouteParams = Promise<{ locale: string }>;
