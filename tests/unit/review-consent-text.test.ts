import { describe, expect, it } from 'vitest';
import { reviewDocuments } from '@/lib/review/documents';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

/**
 * Согласие и разрешение в форме отзыва — текст согласия на отзыв из короткого юрпакета: исполнитель назван
 * по имени и ИНН, почта студии, без заглушек в квадратных скобках и без адреса — адрес только в подписываемых
 * документах. Нумерация сквозная: согласие — пункты 1–4, разрешение — 5–6.
 */

type DocumentText = { title?: string; intro?: string; items?: string[]; check?: string };

type Documents = { edition?: string; consent?: DocumentText; license?: DocumentText };

const DOCUMENTS = {
  ru: (ru.review as unknown as { documents: Documents }).documents,
  en: (en.review as unknown as { documents: Documents }).documents,
};

/** Пробелы любого вида (обычный, U+00A0, U+202F) — в обычный: русские тексты сайта держат неразрывные пробелы. */
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Все строки значения рекурсивно, с путем ключа: в сообщении assert видно, какой ключ виноват. */
const entriesOf = (value: unknown, path: string): { path: string; text: string }[] => {
  if (typeof value === 'string') {
    return [{ path, text: normalize(value) }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => entriesOf(item, `${path}[${index}]`));
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => entriesOf(item, `${path}.${key}`));
  }

  return [];
};

const RU_ENTRIES = entriesOf(DOCUMENTS.ru, 'review.documents');

const EN_ENTRIES = entriesOf(DOCUMENTS.en, 'review.documents');

const joined = (entries: { text: string }[]) => entries.map(({ text }) => text).join('\n');

const RU_INTRO =
  'Я, автор отзыва (фамилия, имя, отчество и почта указаны в этой форме), даю согласие Мурашкиной Веронике ' +
  'Викторовне, плательщику налога на профессиональный доход, ИНН 421815967902, почта hello@mrshkn.com, студия ' +
  '«MRSHKN» (далее — Студия).';

const RU_CONSENT_FIRST =
  'Студия публикует мой отзыв о ее работе на сайте https://mrshkn.com: на главной странице и на странице кейса ' +
  'моего проекта.';

const RU_LICENSE_FIRST =
  'Я автор отзыва и бесплатно разрешаю Студии публиковать его текст на страницах из п. 1. Студия исправляет только ' +
  'опечатки, остальное не меняет. Перевод на другой язык публикуется только после того, как я согласую его текст.';

const RU_LICENSE_SECOND = 'Если я отзову согласие из п. 4, текст снимается с сайта в тот же срок.';

const RU_CONSENT_CHECK = 'Даю согласие на публикацию моих данных на этих условиях.';

const RU_LICENSE_CHECK = 'Разрешаю опубликовать текст отзыва.';

const EN_LICENSE_FIRST =
  'I am the author of the review and allow the Studio, free of charge, to publish its text on the pages listed ' +
  'in item 1. The Studio only fixes typos and changes nothing else. A translation into another language is ' +
  'published only after I approve its text.';

describe('текст согласия в форме отзыва', () => {
  it('C1 ru: названы Мурашкина Вероника Викторовна, ИНН 421815967902 и hello@mrshkn.com', () => {
    const text = joined(RU_ENTRIES);

    expect(text).toMatch(/Мурашкин\S*\s+Вероник\S*\s+Викторовн\S*/);
    expect(text).toContain('421815967902');
    expect(text).toContain('hello@mrshkn.com');
  });

  it('C1 en: названы Veronika Viktorovna Murashkina, ИНН 421815967902 и hello@mrshkn.com', () => {
    const text = joined(EN_ENTRIES);

    expect(text).toContain('Veronika Viktorovna Murashkina');
    expect(text).toContain('421815967902');
    expect(text).toContain('hello@mrshkn.com');
  });

  it.each([
    ['ru', RU_ENTRIES, /адрес/i],
    ['en', EN_ENTRIES, /address/i],
  ] as const)('C2 %s: нет заглушек в квадратных скобках и слова об адресе', (_locale, entries, addressWord) => {
    expect(entries.length, 'строки review.documents').toBeGreaterThan(0);
    expect(
      entries.filter(({ text }) => text.includes('[') || text.includes(']')).map(({ path }) => path),
      'строки с [ или ]',
    ).toEqual([]);
    expect(
      entries.filter(({ text }) => addressWord.test(text)).map(({ path }) => path),
      'строки со словом об адресе',
    ).toEqual([]);
  });

  it.each(['ru', 'en'] as const)('C3 %s: согласие — 4 пункта и вводная фраза, разрешение — 2 пункта', (locale) => {
    const { consent, license } = DOCUMENTS[locale];

    expect(consent?.items?.length, 'пунктов согласия').toBe(4);
    expect(license?.items?.length, 'пунктов разрешения').toBe(2);
    expect(typeof consent?.intro, 'consent.intro').toBe('string');
    expect(normalize(consent?.intro ?? '').length, 'consent.intro непустой').toBeGreaterThan(0);
  });

  it('C4 ru: вводная, первые пункты и подписи галочек — дословно', () => {
    const { consent, license } = DOCUMENTS.ru;

    expect(normalize(consent?.intro ?? '')).toBe(RU_INTRO);
    expect(normalize(consent?.items?.[0] ?? '')).toBe(RU_CONSENT_FIRST);
    expect(normalize(license?.items?.[0] ?? '')).toBe(RU_LICENSE_FIRST);
    expect(normalize(consent?.check ?? '')).toBe(RU_CONSENT_CHECK);
    expect(normalize(license?.check ?? '')).toBe(RU_LICENSE_CHECK);
  });

  it('C5 ru: reviewDocuments — редакция 02.11.2026, вводная и сквозная нумерация', () => {
    const documents = reviewDocuments('ru');
    const consent = normalize(documents.consent);
    const license = normalize(documents.license);

    expect(documents.version).toBe('02.11.2026');
    expect(consent).toContain('Редакция от 02.11.2026');
    expect(consent).toContain(RU_INTRO);
    expect(consent).toContain(`1. ${RU_CONSENT_FIRST}`);
    expect(license).toContain(`5. ${RU_LICENSE_FIRST}`);
    expect(license).toContain(`6. ${RU_LICENSE_SECOND}`);
  });

  it('C5 en: reviewDocuments — Version of 02.11.2026 и пункт 5 разрешения', () => {
    const documents = reviewDocuments('en');

    expect(documents.version).toBe('02.11.2026');
    expect(normalize(documents.consent)).toContain('Version of 02.11.2026');
    expect(normalize(documents.license)).toContain(`5. ${EN_LICENSE_FIRST}`);
  });
});
