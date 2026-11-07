import { describe, expect, it } from 'vitest';
import { readGlossary, segmentTerms } from '@/lib/glossary';
import type { GlossaryEntry, TermSegment } from '@/lib/glossary/types';
import ru from '../../messages/ru.json';

/**
 * Разметка текста подсказками: формы слова ищутся без учета регистра и только целым словом, обернуто только первое
 * вхождение записи в секции (общий `used` секции), токены «число-дефис-буквы» («152-ФЗ») остаются без переноса,
 * а склейка кусков дает исходный текст байт в байт.
 */

const entry = (id: string, forms: string[]): GlossaryEntry => ({ id, word: forms[0], forms, text: `Подсказка ${id}.` });

/** Маленький словарь сценариев. У Яндекс Метрики есть и короткие формы: на одной позиции берется самая длинная. */
const GLOSSARY: GlossaryEntry[] = [
  entry('hosting', ['хостинг', 'хостинга', 'хостинге', 'хостингу', 'хостингом']),
  entry('admin', ['админка', 'админки', 'админке', 'админку', 'админкой']),
  entry('act', ['акт', 'акта', 'акте', 'акту', 'актом']),
  entry('domain', ['домен', 'домена', 'домене', 'домену', 'доменом', 'домены']),
  entry('landing', ['лендинг', 'лендинга', 'лендинге', 'лендингу', 'лендингом', 'лендинги']),
  entry('sourceCode', ['исходный код', 'исходного кода', 'исходному коду', 'исходным кодом', 'исходном коде']),
  entry('speedTest', ['тест скорости', 'теста скорости', 'тесте скорости', 'тесту скорости', 'тестом скорости']),
  entry('metrika', ['Яндекс', 'Метрику', 'Яндекс Метрика', 'Яндекс Метрики', 'Яндекс Метрику']),
  entry('miniApp', ['мини-приложение', 'мини-приложения', 'мини-приложении', 'мини-приложением']),
  entry('law152', ['152-ФЗ']),
  entry('nextjs', ['Next.js']),
];

type Entry = { path: string; text: string };

const terms = (segments: TermSegment[]) => segments.filter((segment) => segment.kind === 'term');

const joined = (segments: TermSegment[]) => segments.map((segment) => segment.value).join('');

const term = (id: string, value: string, nowrap = false): TermSegment => ({ kind: 'term', id, value, nowrap });

const segment = (text: string, used = new Set<string>()) => segmentTerms(text, GLOSSARY, used);

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

describe('segmentTerms: формы и регистр', () => {
  it('8: КОГДА «Хостинг оплачиваете напрямую» ТОГДА term hosting «Хостинг» и текст, регистр сохранен', () => {
    expect(segment('Хостинг оплачиваете напрямую')).toEqual([
      term('hosting', 'Хостинг'),
      { kind: 'text', value: ' оплачиваете напрямую' },
    ]);
  });

  it('9: КОГДА «меняете цены в админке» ТОГДА term admin «админке» — найдена не первая форма списка', () => {
    const segments = segment('меняете цены в админке');

    expect(terms(segments)).toEqual([term('admin', 'админке')]);
    expect(joined(segments)).toBe('меняете цены в админке');
  });
});

describe('segmentTerms: первое вхождение в секции', () => {
  it('10: КОГДА «админка … админку» ТОГДА обернута первая; второй текст с тем же used — без term; новый Set — снова обернута', () => {
    const used = new Set<string>();

    expect(terms(segment('Админка открывается по паролю, в админку входите сами', used))).toEqual([
      term('admin', 'Админка'),
    ]);
    expect(terms(segment('Работаете с админкой с телефона', used))).toEqual([]);
    expect(terms(segment('Работаете с админкой с телефона', new Set()))).toEqual([term('admin', 'админкой')]);
  });

  it('11: КОГДА used уже содержит admin ТОГДА «админка» не обернута, а «хостинг» обернут и попал в used', () => {
    const used = new Set(['admin']);

    expect(terms(segment('Админка и хостинг — в цене', used))).toEqual([term('hosting', 'хостинг')]);
    expect(used.has('hosting')).toBe(true);
    expect(used.has('admin')).toBe(true);
  });
});

describe('segmentTerms: только целым словом', () => {
  it.each(['контакт', 'актуальный', 'факт', 'поддомен', '3D-лендинг', 'лендинговый', 'доменный'])(
    '12: КОГДА «%s» ТОГДА ни одного term',
    (text) => {
      const segments = segment(text);

      expect(terms(segments)).toEqual([]);
      expect(joined(segments)).toBe(text);
    },
  );

  it('12: КОГДА «мини-приложение в Telegram» ТОГДА term miniApp «мини-приложение» — дефис внутри формы допустим', () => {
    expect(terms(segment('мини-приложение в Telegram'))).toEqual([term('miniApp', 'мини-приложение')]);
  });
});

describe('segmentTerms: формы из нескольких слов и знаков', () => {
  it('13: КОГДА «исходный код» через U+00A0 и «тест скорости» через пробел ТОГДА оба найдены, пробел текста сохранен', () => {
    expect(terms(segment('передаем исходный код'))).toEqual([term('sourceCode', 'исходный код')]);
    expect(terms(segment('тест скорости'))).toEqual([term('speedTest', 'тест скорости')]);
  });

  it('13а: КОГДА «Next.js» в тексте ТОГДА term nextjs; «Next.jsx» и «NextXjs» — без term: точка формы буквальная', () => {
    expect(terms(segment('программным кодом на Next.js, а не в конструкторе'))).toEqual([term('nextjs', 'Next.js')]);
    expect(terms(segment('Next.jsx'))).toEqual([]);
    expect(terms(segment('NextXjs'))).toEqual([]);
  });

  it('14: КОГДА «подключаем Яндекс Метрику» ТОГДА один term metrika «Яндекс Метрику» — самая длинная форма', () => {
    const segments = segment('подключаем Яндекс Метрику');

    expect(terms(segments)).toEqual([term('metrika', 'Яндекс Метрику')]);
    expect(joined(segments)).toBe('подключаем Яндекс Метрику');
  });
});

describe('segmentTerms вместе с nowrap', () => {
  it('15: КОГДА «по закону (152-ФЗ) и 63-ФЗ» ТОГДА 152-ФЗ — term с nowrap, 63-ФЗ — nowrap; второй раз 152-ФЗ — nowrap', () => {
    const used = new Set<string>();

    expect(segment('по закону (152-ФЗ) и 63-ФЗ', used)).toEqual([
      { kind: 'text', value: 'по закону (' },
      term('law152', '152-ФЗ', true),
      { kind: 'text', value: ') и ' },
      { kind: 'nowrap', value: '63-ФЗ' },
    ]);
    expect(segment('согласие по 152-ФЗ', used)).toEqual([
      { kind: 'text', value: 'согласие по ' },
      { kind: 'nowrap', value: '152-ФЗ' },
    ]);
  });
});

describe('segmentTerms без потерь', () => {
  it('16: КОГДА каждую строку ru.json размечаем словарем ru ТОГДА склейка кусков равна строке', () => {
    const glossary = readGlossary(ru);
    const messages = Object.fromEntries(Object.entries(ru).filter(([key]) => key !== 'glossary'));
    const broken = strings(messages, '').filter(({ text }) => joined(segmentTerms(text, glossary, new Set())) !== text);

    expect(broken.map(({ path }) => path)).toEqual([]);
  });

  it('17: КОГДА текст пустой ТОГДА склейка пустая и term нет; КОГДА словарь пустой ТОГДА ни одного term', () => {
    const empty = segment('');

    expect(joined(empty)).toBe('');
    expect(terms(empty)).toEqual([]);

    const text = 'Хостинг и админка по 152-ФЗ';
    const withoutGlossary = segmentTerms(text, [], new Set());

    expect(terms(withoutGlossary)).toEqual([]);
    expect(joined(withoutGlossary)).toBe(text);
  });
});
