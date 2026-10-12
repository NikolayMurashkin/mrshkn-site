import { readFileSync } from 'node:fs';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { TEAM_ROLES } from '@/cms/consts';
import type { TeamMember } from '@/cms/types';
import { DESIGN_NAMES } from '@/designs/consts';
import { LOCALES } from '@/i18n/consts';
import { teamExperienceYears, teamInitials } from '@/lib/team';
import messages from '../../messages/ru.json';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/ru',
  useParams: () => ({ locale: 'ru' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

type Role = TeamMember['role'];

type TeamProps = { core: TeamMember[]; network: TeamMember[] };

const CURRENT_YEAR = new Date().getFullYear();

const readMessages = (locale: string) => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'));

/** Подпись роли из ru.json: раздел `team` появится вместе с секцией, до этого подписи нет. */
const roleLabel = (role: Role): string =>
  (messages as unknown as { team?: { roles?: Record<string, string> } }).team?.roles?.[role] ?? `нет подписи ${role}`;

/** Люди в тестах — заведомые заглушки, не реальные имена. */
const makeMember = (index: number, overrides: Partial<TeamMember> = {}): TeamMember => ({
  name: `Тестовый Участник ${index}`,
  role: 'developer',
  yearsSince: 2015,
  about: null,
  skills: [],
  photo: null,
  ...overrides,
});

const MODULES = import.meta.glob('../../src/designs/*/Team.tsx');

const loadTeam = async (design: string): Promise<ComponentType<TeamProps>> => {
  const name = `${design[0].toUpperCase()}${design.slice(1)}Team`;
  const load = MODULES[`../../src/designs/${design}/Team.tsx`];
  const designModule = (load ? await load() : {}) as Record<string, unknown>;

  const component = designModule[name];

  expect(component, `у направления ${design} нет Team`).toBeTypeOf('function');

  return component as ComponentType<TeamProps>;
};

type ProviderProps = { locale: string; messages: typeof messages; children?: ReactNode };

const Provider = NextIntlClientProvider as ComponentType<ProviderProps>;

const render = (Team: ComponentType<TeamProps>, props: TeamProps) =>
  renderToStaticMarkup(createElement(Provider, { locale: 'ru', messages }, createElement(Team, props)));

/** Элементы с `data-testid` целиком, от открывающего тега до парного закрывающего. */
const elementsBy = (html: string, testId: string): string[] =>
  [...html.matchAll(new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*\\bdata-testid="${testId}"[^>]*>`, 'g'))].map((match) => {
    const tags = new RegExp(`<(/?)${match[1]}\\b[^>]*>`, 'g');
    let depth = 1;
    let next: RegExpExecArray | null = null;

    tags.lastIndex = match.index + match[0].length;

    while (depth > 0 && (next = tags.exec(html))) {
      depth += next[1] ? -1 : 1;
    }

    return html.slice(match.index, next ? tags.lastIndex : html.length);
  });

const textOf = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const cardOf = (html: string, name: string) => {
  const card = elementsBy(html, 'team-member').find((item) => textOf(item).includes(name));

  expect(card, `нет карточки «${name}»`).toBeTypeOf('string');

  return card ?? '';
};

describe('сумма лет опыта команды', () => {
  it('teamExperienceYears: сумма лет по году начала', () => {
    expect(teamExperienceYears([{ yearsSince: 2012 }, { yearsSince: 2019 }], 2026)).toBe(21);
  });

  it('teamExperienceYears: пустая команда — 0', () => {
    expect(teamExperienceYears([], 2026)).toBe(0);
  });

  it('teamExperienceYears: по умолчанию текущий год', () => {
    expect(teamExperienceYears([{ yearsSince: CURRENT_YEAR - 5 }])).toBe(5);
  });

  it('teamExperienceYears: год из будущего не уменьшает сумму', () => {
    expect(teamExperienceYears([{ yearsSince: 2030 }, { yearsSince: 2016 }], 2026)).toBe(10);
  });

  it('teamExperienceYears: считает и ядро, и сеть', () => {
    const core = [makeMember(1, { yearsSince: 2016 }), makeMember(2, { yearsSince: 2020 })];
    const network = [makeMember(3, { yearsSince: 2010 })];

    expect(teamExperienceYears([...core, ...network], 2026)).toBe(32);
  });
});

describe('монограмма участника', () => {
  it('teamInitials: первые буквы двух первых слов', () => {
    expect(teamInitials('Тестовый Участник')).toBe('ТУ');
    expect(teamInitials('Анна Мария Тестова')).toBe('АМ');
  });

  it('teamInitials: одно слово — одна буква', () => {
    expect(teamInitials('Тестовый')).toBe('Т');
  });

  it('teamInitials: регистр и лишние пробелы', () => {
    expect(teamInitials('  тестовый   участник ')).toBe('ТУ');
    expect(teamInitials('test member')).toBe('TM');
  });
});

describe('секция «Команда»', () => {
  it.each([...DESIGN_NAMES])('%s: при пустой сети — только ядро и карточка сети с ролями', async (design) => {
    const Team = await loadTeam(design);
    const core = [makeMember(1, { role: 'lead' }), makeMember(2, { role: 'designer' })];

    const html = render(Team, { core, network: [] });
    const cards = elementsBy(html, 'team-member').map(textOf);
    const networkCards = elementsBy(html, 'team-network');

    expect(cards).toHaveLength(2);
    expect(cards[0]).toContain(core[0].name);
    expect(cards[1]).toContain(core[1].name);
    expect(networkCards).toHaveLength(1);

    const networkText = textOf(networkCards[0]);

    (['designer', 'copywriter', 'qa'] as const).forEach((role) => expect(networkText).toContain(roleLabel(role)));
  });

  it.each([...DESIGN_NAMES])('%s: сеть из CMS — своими карточками вместо заглушки', async (design) => {
    const Team = await loadTeam(design);
    const core = [makeMember(1, { role: 'lead' }), makeMember(2, { role: 'designer' })];
    const network = [makeMember(3, { role: 'copywriter' }), makeMember(4, { role: 'qa' })];

    const html = render(Team, { core, network });
    const cards = elementsBy(html, 'team-member').map(textOf);

    expect(cards).toHaveLength(4);
    [...core, ...network].forEach(({ name }) =>
      expect(
        cards.filter((card) => card.includes(name)),
        name,
      ).toHaveLength(1),
    );
    expect(elementsBy(html, 'team-network')).toHaveLength(0);
  });

  it.each([...DESIGN_NAMES])('%s: в карточке — имя, роль, «о себе» и теги навыков', async (design) => {
    const Team = await loadTeam(design);
    const plain = makeMember(1, { role: 'lead', skills: [] });
    const developer = makeMember(2, {
      role: 'developer',
      about: 'Пишет код и тесты к нему',
      skills: ['Next.js', 'Payload'],
    });

    const html = render(Team, { core: [plain, developer], network: [] });
    const card = cardOf(html, developer.name);
    const text = textOf(card);

    expect(text).toContain(developer.name);
    expect(text).toContain(roleLabel('developer'));
    expect(text).toContain('Пишет код и тесты к нему');
    expect(elementsBy(card, 'team-skill').map(textOf)).toEqual(['Next.js', 'Payload']);
    expect(elementsBy(cardOf(html, plain.name), 'team-skill')).toHaveLength(0);
  });

  it.each([...DESIGN_NAMES])('%s: сумма лет считается из данных', async (design) => {
    const Team = await loadTeam(design);
    const core = [makeMember(1, { yearsSince: CURRENT_YEAR - 10 }), makeMember(2, { yearsSince: CURRENT_YEAR - 7 })];

    expect(textOf(render(Team, { core, network: [] }))).toMatch(/(?<!\d)17[\s ]лет(?![а-яё])/);

    const network = [makeMember(3, { yearsSince: CURRENT_YEAR - 4 })];

    expect(textOf(render(Team, { core, network }))).toMatch(/(?<!\d)21[\s ]год(?![а-яё])/);
  });

  it.each([...DESIGN_NAMES])('%s: фото только реальное, без фото — без <img>', async (design) => {
    const Team = await loadTeam(design);
    const withPhoto = makeMember(1, {
      photo: { url: '/media/p.webp', alt: 'Фото участника для теста', width: 600, height: 600, srcSet: null },
    });
    const withoutPhoto = makeMember(2);

    const html = render(Team, { core: [withPhoto, withoutPhoto], network: [] });
    const images = cardOf(html, withPhoto.name).match(/<img\b[^>]*>/g) ?? [];

    expect(images).toHaveLength(1);
    expect(images[0]).toContain('src="/media/p.webp"');
    expect(images[0]).toContain('alt="Фото участника для теста"');
    expect(cardOf(html, withoutPhoto.name)).not.toContain('<img');
  });

  it.each([...DESIGN_NAMES])('%s: пустая команда — пустая строка', async (design) => {
    const Team = await loadTeam(design);

    expect(render(Team, { core: [], network: [] })).toBe('');
  });
});

describe('тексты секции «Команда»', () => {
  it.each([...LOCALES])('%s: подписи всех ролей', (locale) => {
    const roles = readMessages(locale).team?.roles ?? {};

    expect(TEAM_ROLES.map((role) => roles[role])).toEqual(TEAM_ROLES.map(() => expect.stringMatching(/\S/)));
  });

  /** Путь ключа с ICU plural по `years` внутри раздела `team`: имя ключа выбирает реализация. */
  const findYearsPhrase = (section: unknown, path: string[] = []): string | undefined => {
    if (typeof section === 'string') {
      return /\{\s*years\s*,\s*plural\s*,/.test(section) ? path.join('.') : undefined;
    }

    if (typeof section !== 'object' || section === null) {
      return undefined;
    }

    return Object.entries(section)
      .map(([key, value]) => findYearsPhrase(value, [...path, key]))
      .find((found) => found !== undefined);
  };

  it('en: сумма лет склоняется', async () => {
    const { createTranslator } = await import('next-intl');
    const en = readMessages('en');
    const key = findYearsPhrase(en.team);

    expect(key, 'в en.json нет фразы {years, plural, …} в разделе team').toBeTypeOf('string');

    const t = createTranslator({ locale: 'en', messages: en, namespace: 'team' } as never) as unknown as (
      key: string,
      values: { years: number },
    ) => string;

    expect(t(key ?? '', { years: 1 })).toMatch(/(?<!\d)1[\s ]year(?!s)/);
    expect(t(key ?? '', { years: 17 })).toMatch(/(?<!\d)17[\s ]years/);
  });
});
