import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PRIVACY_SECTIONS } from '@/components/PrivacyPolicy/consts';
import { usePrivacyPolicy } from '@/components/PrivacyPolicy/use-privacy-policy';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

type Messages = Record<string, unknown>;

/** Все строки значения рекурсивно: объекты и массивы обходятся целиком. */
const stringsOf = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(stringsOf);
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(stringsOf);
  }

  return [];
};

/** Пути до каждой строки: по ним сверяются переводы. */
const keysOf = (value: unknown, prefix = ''): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => keysOf(item, `${prefix}[${index}]`));
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => keysOf(item, prefix ? `${prefix}.${key}` : key));
  }

  return [prefix];
};

const privacyOf = (messages: Messages) => messages.privacy;

const privacyStrings = (messages: Messages) => {
  const strings = stringsOf(privacyOf(messages));

  expect(strings.length, 'нет строк политики в пространстве privacy').toBeGreaterThan(0);

  return strings;
};

describe('политика ПД называет Telegram каналом заявок', () => {
  it('P1 ru: есть строка про Telegram, имя, контакт и заявку', () => {
    const strings = privacyStrings(ru as Messages);
    const matches = strings.filter(
      (text) => text.includes('Telegram') && /имя|имени/i.test(text) && /контакт/i.test(text) && /заявк/i.test(text),
    );

    expect(matches.length, 'строка о передаче имени и контакта из заявки в Telegram').toBeGreaterThan(0);
  });

  it('P2 en: есть строка про Telegram, name, contact и request', () => {
    const strings = privacyStrings(en as Messages);
    const matches = strings.filter(
      (text) =>
        text.includes('Telegram') &&
        /\bname\b/i.test(text) &&
        /contact/i.test(text) &&
        /request|enquiry|inquiry|brief|lead/i.test(text),
    );

    expect(matches.length, 'строка о передаче name и contact из заявки в Telegram').toBeGreaterThan(0);
  });

  it('P3: ключи политики в ru и en совпадают и непусты', () => {
    const ruKeys = keysOf(privacyOf(ru as Messages)).filter(Boolean);
    const enKeys = keysOf(privacyOf(en as Messages)).filter(Boolean);

    expect(ruKeys.length, 'ключи политики в ru').toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(ruKeys));
  });
});

/** Строки раздела «Куда уходят данные»: заголовок и абзацы. */
const transferStrings = (messages: Messages) => {
  const sections = (privacyOf(messages) as { sections?: { transfer?: unknown } } | undefined)?.sections;
  const strings = stringsOf(sections?.transfer);

  expect(strings.length, 'нет строк в privacy.sections.transfer').toBeGreaterThan(0);

  return strings;
};

describe('политика ПД говорит, что заявка сохраняется в базе сайта', () => {
  it('P4 ru: в разделе «Куда уходят данные» есть строка про заявку и базу сайта', () => {
    const matches = transferStrings(ru as Messages).filter(
      (text) => /заявк/i.test(text) && /баз[аеуы]\s+(данных\s+)?сайта/i.test(text),
    );

    expect(matches.length, 'строка о том, что заявка сохраняется в базе сайта').toBeGreaterThan(0);
  });

  it('P5 en: в разделе «Where your data goes» есть строка про request и базу сайта', () => {
    const matches = transferStrings(en as Messages).filter(
      (text) => /request/i.test(text) && /(website|site)('s)?\s+database|database\s+of\s+the\s+(web)?site/i.test(text),
    );

    expect(matches.length, 'строка о том, что request сохраняется в базе сайта').toBeGreaterThan(0);
  });
});

/** Пробелы любого вида (обычный, U+00A0, U+202F) — в обычный: русские тексты сайта держат неразрывные пробелы. */
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Разделы политики в порядке документа: последний — согласие на обработку данных из формы заявки. */
const SECTION_ORDER = ['operator', 'data', 'storage', 'transfer', 'cookies', 'rights', 'changes', 'consent'];

const sectionsOf = (messages: Messages) =>
  ((privacyOf(messages) as { sections?: Record<string, unknown> } | undefined)?.sections ?? {}) as Record<
    string,
    unknown
  >;

const sectionText = (messages: Messages, id: string) => stringsOf(sectionsOf(messages)[id]).map(normalize);

const updatedOf = (messages: Messages) =>
  normalize(String((privacyOf(messages) as { updated?: unknown } | undefined)?.updated ?? ''));

/** Якоря разделов, которые политика отдает верстке пяти направлений. */
const anchorsOf = (locale: 'ru' | 'en', messages: Messages) => {
  let anchors: string[] = [];

  const Probe = () => {
    anchors = usePrivacyPolicy().sections.map(({ anchor }) => anchor);

    return null;
  };

  renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      {
        locale,
        messages: messages as AbstractIntlMessages,
        timeZone: 'Europe/Moscow',
      } as ComponentProps<typeof NextIntlClientProvider>,
      createElement(Probe),
    ),
  );

  return anchors;
};

describe('политика ПД — текст короткого юрпакета', () => {
  it.each([
    ['ru', ru],
    ['en', en],
  ] as const)('P6 %s: разделы по порядку документа, согласие последним', (_locale, messages) => {
    expect(Object.keys(sectionsOf(messages as Messages))).toEqual(SECTION_ORDER);
  });

  it('P7 ru: оператор — Мурашкина Вероника Викторовна, ИНН 421815967902', () => {
    const text = sectionText(ru as Messages, 'operator').join('\n');

    expect(text).toContain('Мурашкина Вероника Викторовна');
    expect(text).toContain('421815967902');
  });

  it('P7 en: оператор — Veronika Viktorovna Murashkina, ИНН 421815967902', () => {
    const text = sectionText(en as Messages, 'operator').join('\n');

    expect(text).toContain('Veronika Viktorovna Murashkina');
    expect(text).toContain('421815967902');
  });

  it('P8: строка редакции ru и en — версия 1.0 от 02.11.2026 и адрес публикации', () => {
    expect(updatedOf(ru as Messages)).toBe(
      'Редакция 1.0 от 02.11.2026. Адрес публикации: https://mrshkn.com/ru/docs/privacy',
    );
    expect(updatedOf(en as Messages)).toBe(
      'Version 1.0 of 2 November 2026. Published at https://mrshkn.com/en/docs/privacy',
    );
  });

  it('P9 ru: раздел согласия — адрес #consent и текст согласия на Веронику', () => {
    const strings = sectionText(ru as Messages, 'consent');

    expect(strings.join('\n')).toContain('https://mrshkn.com/ru/docs/privacy#consent');
    expect(
      strings.filter((text) =>
        text.startsWith('Отмечая это поле и отправляя заявку, я даю согласие Мурашкиной Веронике Викторовне'),
      ),
      `строки раздела: ${JSON.stringify(strings)}`,
    ).toHaveLength(1);
  });

  it('P9 en: раздел согласия — адрес #consent и текст согласия', () => {
    const strings = sectionText(en as Messages, 'consent');

    expect(strings.join('\n')).toContain('https://mrshkn.com/en/docs/privacy#consent');
    expect(
      strings.filter((text) => text.startsWith('By checking this box and sending the request')),
      `строки раздела: ${JSON.stringify(strings)}`,
    ).toHaveLength(1);
  });

  it.each([
    ['ru', ru],
    ['en', en],
  ] as const)('P10 %s: порядок разделов в коде тот же, якорь согласия — ровно consent', (locale, messages) => {
    expect([...PRIVACY_SECTIONS]).toEqual(SECTION_ORDER);
    expect(anchorsOf(locale, messages as Messages)).toEqual(
      SECTION_ORDER.map((id) => (id === 'consent' ? 'consent' : `privacy-${id}`)),
    );
  });
});
