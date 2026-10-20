import { describe, expect, it } from 'vitest';
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
