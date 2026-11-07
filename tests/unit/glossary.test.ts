import { describe, expect, it } from 'vitest';
import { countSentences, readGlossary, segmentTerms } from '@/lib/glossary';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import { APPROVED_GLOSSARY } from './glossary-approved';

/**
 * Словарь подсказок к непонятным словам живет в `messages/ru.json` под ключом `glossary`: у каждого слова формы,
 * по которым оно ищется в текстах, и объяснение в одну-две фразы без других слов словаря. На английском подсказок нет:
 * ключа в `en.json` нет, разметка английских текстов ничего не оборачивает.
 */

type Entry = { path: string; text: string };

const APPROVED_IDS = Object.keys(APPROVED_GLOSSARY);

const ESCAPE = /[.*+?^${}()|[\]\\]/g;

/** Форма целым словом: до и после нет буквы, цифры или дефиса; пробел формы совпадает с любым пробелом текста. */
const formPattern = (form: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}-])${form.replace(ESCAPE, '\\$&').replace(/ /g, '\\s')}(?![\\p{L}\\p{N}-])`, 'iu');

const strings = (value: unknown, path: string): Entry[] => {
  if (typeof value === 'string') {
    return [{ path, text: value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => strings(item, path ? `${path}.${key}` : key));
  }

  return [];
};

const ruGlossary = () => readGlossary(ru);

const entryOf = (id: string) => ruGlossary().find((entry) => entry.id === id);

describe('словарь подсказок в ru.json', () => {
  it('1: КОГДА читаем readGlossary(ru) ТОГДА 35 записей с непустыми word и text, формы без пустых и повторов, word среди форм', () => {
    const entries = ruGlossary();

    expect(entries.map((entry) => entry.id)).toEqual(APPROVED_IDS);
    expect(entries).toHaveLength(35);

    for (const entry of entries) {
      expect(entry.word.trim(), `${entry.id}: word`).not.toBe('');
      expect(entry.text.trim(), `${entry.id}: text`).not.toBe('');
      expect(Array.isArray(entry.forms), `${entry.id}: forms — массив`).toBe(true);
      expect(entry.forms.length, `${entry.id}: форм`).toBeGreaterThanOrEqual(1);
      expect(
        entry.forms.filter((form) => form.trim() === ''),
        `${entry.id}: пустые формы`,
      ).toEqual([]);
      expect(new Set(entry.forms).size, `${entry.id}: повторы форм`).toBe(entry.forms.length);
      expect(entry.forms, `${entry.id}: word среди форм`).toContain(entry.word);
    }
  });

  it.each(APPROVED_IDS)('2: КОГДА считаем предложения объяснения %s ТОГДА их 1 или 2', (id) => {
    const entry = entryOf(id);

    expect(entry, `${id}: запись в словаре`).toBeDefined();
    expect([1, 2]).toContain(countSentences(entry?.text ?? ''));
  });

  it.each(APPROVED_IDS)('3: КОГДА ищем формы других записей в объяснении %s ТОГДА совпадений нет', (id) => {
    const entries = ruGlossary();
    const entry = entries.find((item) => item.id === id);

    expect(entry, `${id}: запись в словаре`).toBeDefined();

    const found = entries
      .filter((other) => other.id !== id)
      .flatMap((other) =>
        other.forms.filter((form) => formPattern(form).test(entry?.text ?? '')).map((form) => `${other.id}: ${form}`),
      );

    expect(found).toEqual([]);
  });

  it('4: КОГДА собираем формы всех записей без учета регистра ТОГДА ни одна не принадлежит двум записям', () => {
    const owners = new Map<string, Set<string>>();

    for (const entry of ruGlossary()) {
      for (const form of entry.forms) {
        const key = form.toLowerCase();

        owners.set(key, (owners.get(key) ?? new Set()).add(entry.id));
      }
    }

    expect(owners.size, 'форм в словаре').toBeGreaterThan(0);
    expect(
      [...owners].filter(([, ids]) => ids.size > 1).map(([form, ids]) => `${form}: ${[...ids].join(', ')}`),
    ).toEqual([]);
  });

  it('5: КОГДА сравниваем ru.glossary с утвержденным словарем ТОГДА равны дословно и в том же порядке', () => {
    const glossary = (ru as Record<string, unknown>).glossary;

    expect(glossary).toStrictEqual(APPROVED_GLOSSARY);
    expect(Object.keys((glossary ?? {}) as object)).toEqual(APPROVED_IDS);
  });

  it('5а: КОГДА читаем ru.json ТОГДА три правленых текста равны утвержденным, en.json по этим ключам прежний', () => {
    expect(ru.pricing.plans.mvp.summary).toBe(
      'Первая версия вашего онлайн-сервиса: вход по\u00a0паролю, личные кабинеты, оплата, связь с\u00a0другими программами и\u00a0статистика',
    );
    expect(ru.pricing.basicsNote).toBe(
      '13 пунктов в\u00a0цене. Хостинг вы оплачиваете напрямую провайдеру, домен\u00a0— регистратору. У\u00a0приложений в\u00a0Telegram, 3D и\u00a0поддержки\u00a0— свой список на\u00a0их страницах',
    );
    expect(ru.servicePage.basicsNote).toBe(
      '13 пунктов в\u00a0цене. Хостинг вы оплачиваете напрямую провайдеру, домен\u00a0— регистратору',
    );

    expect(en.pricing.plans.mvp.summary).toBe('Web app: sign-in, user accounts, payments, integrations, analytics');
    expect(en.pricing.basicsNote).toBe(
      '13 items in the price; hosting and domain are paid to the provider directly. Telegram apps, 3D and support have their own lists on their pages',
    );
    expect(en.servicePage.basicsNote).toBe('13 items in the price; hosting and domain go to the provider');
  });
});

describe('countSentences', () => {
  it.each([
    ['Одна. Две.', 2],
    ['Адрес сайта, например ваше-название.рф. Его продлевают раз в год.', 2],
    ['Итог — число от 0 до 100.', 1],
    ['Раз? Два! Три…', 3],
    ['Без точки', 1],
    ['', 0],
  ])('6: «%s» → %i', (text, expected) => {
    expect(countSentences(text)).toBe(expected);
  });
});

describe('readGlossary', () => {
  it('7: КОГДА glossary нет, это строка или вместо сообщений null ТОГДА [], КОГДА две записи ТОГДА два GlossaryEntry по порядку ключей', () => {
    expect(readGlossary({ hero: { title: 'Заголовок' } })).toEqual([]);
    expect(readGlossary({ glossary: 'строка' })).toEqual([]);
    expect(readGlossary(null)).toEqual([]);
    expect(
      readGlossary({
        glossary: {
          landing: { word: 'лендинг', forms: ['лендинг', 'лендинга'], text: 'Сайт из\u00a0одной страницы.' },
          act: { word: 'акт', forms: ['акт'], text: 'Документ в\u00a0конце работы.' },
        },
      }),
    ).toEqual([
      { id: 'landing', word: 'лендинг', forms: ['лендинг', 'лендинга'], text: 'Сайт из\u00a0одной страницы.' },
      { id: 'act', word: 'акт', forms: ['акт'], text: 'Документ в\u00a0конце работы.' },
    ]);
  });
});

describe('английский без подсказок', () => {
  it('18: КОГДА читаем en.json ТОГДА ключа glossary нет и readGlossary(en) — []', () => {
    expect(Object.keys(en)).not.toContain('glossary');
    expect(readGlossary(en)).toEqual([]);
  });

  it('19: КОГДА каждую строку en.json размечаем словарем en ТОГДА ни одного term', () => {
    const glossary = readGlossary(en);
    const wrapped = strings(en, '').filter(({ text }) =>
      segmentTerms(text, glossary, new Set()).some((segment) => segment.kind === 'term'),
    );

    expect(wrapped.map(({ path }) => path)).toEqual([]);
  });
});
