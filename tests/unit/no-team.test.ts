import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DESIGN_NAMES, SECTION_NAMES } from '@/designs/consts';
import { LOCALES } from '@/i18n/consts';

/**
 * Людей студии на сайте нет: секция «Команда», ее коллекция и весь код вокруг удалены. Тест читает исходники
 * и ловит остатки — мертвый код, ключи переводов, засев Lighthouse. Прошлые миграции законно создают таблицы
 * `team`, поэтому `src/migrations/` в обход не входит.
 */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SRC_DIR = join(ROOT, 'src');
const SCRIPTS_DIR = join(ROOT, 'scripts');
const MIGRATIONS_DIR = join(SRC_DIR, 'migrations');

const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

/** Пути файлов каталога относительно корня репозитория, без `src/migrations/`. */
const listFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => path !== MIGRATIONS_DIR && !path.startsWith(MIGRATIONS_DIR + sep))
    .map((path) => relative(ROOT, path));

const CODE_FILES = [...listFiles(SRC_DIR), ...listFiles(SCRIPTS_DIR)].filter((path) => /\.tsx?$/.test(path));

const REMOVED_FILES = [
  'src/components/TeamPortrait.tsx',
  'src/cms/team.ts',
  'src/cms/collections/Team.ts',
  'src/designs/team.ts',
  'src/lib/team.ts',
];

const REMOVED_IDENTIFIERS = [
  'TeamPortrait',
  'getTeam',
  'TEAM_ROLES',
  'TEAM_ROLE_LABELS',
  'TeamRole',
  'TeamMember',
  'TEAM_NETWORK_ROLES',
  'TEAM_PHOTO_SIZES',
  'teamSection',
  'teamExperienceYears',
  'teamInitials',
  'TeamProps',
  'TeamCardData',
  'TeamSectionData',
];

describe('секции «Команда» на сайте нет', () => {
  it('в src нет файлов Team.tsx и Team.module.scss', () => {
    const found = listFiles(SRC_DIR).filter((path) => ['Team.tsx', 'Team.module.scss'].includes(basename(path)));

    expect(found).toEqual([]);
  });

  it.each(REMOVED_FILES)('файла %s нет', (path) => {
    expect(existsSync(join(ROOT, path))).toBe(false);
  });

  it.each(REMOVED_IDENTIFIERS)('ни один файл в src и scripts не упоминает %s', (identifier) => {
    const pattern = new RegExp(`\\b${identifier}\\b`);
    const found = CODE_FILES.filter((path) => pattern.test(read(path)));

    expect(found, `${identifier} остался в файлах`).toEqual([]);
  });
});

describe('реестр направлений не отдает секцию команды', () => {
  it('в SECTION_NAMES нет team', () => {
    expect([...SECTION_NAMES] as string[]).not.toContain('team');
  });

  it.each([...DESIGN_NAMES])('%s: в index.tsx нет ключа team и импорта из ./Team', (design) => {
    const source = read(`src/designs/${design}/index.tsx`);

    expect(source).not.toMatch(/^\s*team\s*:/m);
    expect(source).not.toMatch(/from\s+['"]\.\/Team['"]/);
  });

  it('в render.ts нет ветки для team', () => {
    expect(read('src/designs/render.ts')).not.toMatch(/case\s+['"]team['"]/);
  });

  it('главная не вызывает секцию team', () => {
    expect(read('src/app/[locale]/page.tsx')).not.toMatch(/section=(?:"team"|\{\s*['"]team['"]\s*\})/);
  });
});

describe('переводов команды нет', () => {
  it.each([...LOCALES])('%s: в messages нет ключа team', (locale) => {
    const messages = JSON.parse(read(`messages/${locale}.json`)) as Record<string, unknown>;

    expect(Object.keys(messages)).not.toContain('team');
  });

  it('в TRANSLATION-TODO.md нет строк с ключами team.*', () => {
    const rows = read('messages/TRANSLATION-TODO.md')
      .split('\n')
      .filter((line) => line.trimStart().startsWith('|') && line.includes('`team.'));

    expect(rows).toEqual([]);
  });
});

describe('коллекции team нет', () => {
  it('schema.ts не импортирует коллекцию Team, в payload-types.ts нет коллекции team', () => {
    const types = read('src/payload-types.ts');
    const collections = types.match(/\n {2}collections: \{\n([\s\S]*?)\n {2}\};/)?.[1];

    expect(read('src/cms/schema.ts')).not.toMatch(/import\s*\{[^}]*\bTeam\b[^}]*\}\s*from/);
    expect(collections, 'в Config нет блока collections').toBeDefined();
    expect(collections).not.toMatch(/^\s*['"]?team['"]?\s*:/m);
    expect(types).not.toMatch(/^export interface Team\b/m);
  });

  it('засев Lighthouse не создает людей', () => {
    expect(read('scripts/seed-lighthouse.ts')).not.toMatch(/collection:\s*['"]team['"]/);
  });
});
