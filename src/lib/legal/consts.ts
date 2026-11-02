import type { SiteLocale } from '@/i18n/types';
import { HOW_WE_WORK_HREF, OFFER_HREF } from '@/lib/consts';

/**
 * Документы короткого юрпакета на сайте: адрес без языка, файл в `content/legal/` и ключ текстов страницы
 * в `messages/ru.json`. Файлы — копии `docs/legal/ru-simple/` байт в байт: формулировки меняются только там.
 * `history` — под текстом блок прошлых редакций: на памятку договор ссылается с датой редакции.
 */
export const LEGAL_DOCUMENTS = {
  offer: { href: OFFER_HREF, file: 'offer.md', messages: 'docs.offer', history: false },
  howWeWork: {
    href: HOW_WE_WORK_HREF,
    file: 'how-we-work.md',
    messages: 'docs.howWeWork',
    history: true,
  },
} as const;

/** Язык документов: английского пакета еще нет → на `/en/…` их страниц нет. */
export const LEGAL_LOCALE: SiteLocale = 'ru';

/** Строка нумерованного пункта: одно число и точка. Пункт договора `1.1. ` — абзац, номер остается в тексте. */
export const LEGAL_ORDERED_ITEM = /^(\d+)\. (.*)$/;

export const LEGAL_BULLET_ITEM = /^- (.*)$/;

export const LEGAL_TITLE = /^# (.*)$/;

export const LEGAL_HEADING = /^## (.*)$/;

export const LEGAL_STRONG = /\*\*(.+?)\*\*/g;

/** Якорь раздела документа — `section-<N>`, N — номер по порядку среди разделов с заголовком: `/ru/docs/offer#section-5`. */
export const LEGAL_SECTION_ANCHOR = 'section-';

/** Якорь блока прошлых редакций под текстом документа. */
export const LEGAL_HISTORY_ANCHOR = 'history';
