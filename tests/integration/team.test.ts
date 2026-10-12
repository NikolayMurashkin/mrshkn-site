import config from '@payload-config';
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@/cms/consts';
import { getTeam } from '@/cms/team';

let payload: Payload;

beforeAll(async () => {
  payload = await getPayload({ config });
});

afterAll(async () => {
  await payload.destroy();
});

/** Файлы интеграции идут по очереди в одной базе, и соседний файл уже заводит участника команды. */
beforeEach(async () => {
  await payload.delete({ collection: 'team', where: {}, overrideAccess: true });
});

type TeamData = RequiredDataFromCollectionSlug<'team'>;

type MemberInput = {
  name: string;
  role: 'lead' | 'designer' | 'copywriter' | 'developer' | 'qa';
  core: boolean;
  yearsSince: number;
  about?: string;
  skills?: string[];
  photo?: number;
};

/**
 * Навыки — локализованный список строк. Форму хранения в Payload выбирает реализация: поле `text` с `hasMany`
 * принимает строки, поле `array` — строки по одной в строке массива. Тест подстраивает данные под поле.
 */
const skillsData = (skills: string[]) => {
  const field = payload.collections.team.config.fields.find((item) => 'name' in item && item.name === 'skills');

  if (field?.type === 'array') {
    const subfield = field.fields.find((item) => 'name' in item);
    const key = subfield && 'name' in subfield ? subfield.name : 'value';

    return skills.map((value) => ({ [key]: value }));
  }

  return skills;
};

const memberData = ({ skills, ...rest }: Partial<MemberInput>) =>
  ({ ...rest, ...(skills ? { skills: skillsData(skills) } : {}) }) as unknown as TeamData;

const createMember = (input: MemberInput, options: { user?: Awaited<ReturnType<typeof createAdmin>> } = {}) =>
  payload.create({
    collection: 'team',
    locale: 'ru',
    data: memberData(input),
    ...(options.user ? { user: options.user, overrideAccess: false } : {}),
  });

const translateMember = (id: number, input: Partial<MemberInput>) =>
  payload.update({ collection: 'team', id, locale: 'en', data: memberData(input) });

const createAdmin = () =>
  payload.create({
    collection: 'users',
    data: { email: 'team-admin@example.com', password: 'integration-password', role: Role.Admin },
  });

/** Фото участника лежит в медиатеке: картинку для теста рисует sharp. */
const createImage = async (name: string) => {
  const data = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#2f5bea' } })
    .png()
    .toBuffer();

  return payload.create({
    collection: 'media',
    locale: 'ru',
    data: { alt: `Фото ${name}` },
    file: { data, mimetype: 'image/png', name: `${name}.png`, size: data.length },
  });
};

const MEMBER_A: MemberInput = {
  name: 'Тестовый Участник А',
  role: 'lead',
  core: true,
  yearsSince: 2012,
  about: 'Ведет проект от брифа до запуска',
  skills: ['Тексты'],
};

const MEMBER_B: MemberInput = {
  name: 'Тестовый Участник Б',
  role: 'qa',
  core: false,
  yearsSince: 2018,
  about: 'Проверяет сайт перед запуском',
  skills: ['Playwright'],
};

const MEMBER_C: MemberInput = {
  name: 'Тестовый Участник В',
  role: 'designer',
  core: true,
  yearsSince: 2016,
  about: 'Рисует интерфейсы',
  skills: ['Figma'],
};

const expected = ({ name, role, yearsSince, about, skills }: MemberInput) => ({
  name,
  role,
  yearsSince,
  about,
  skills,
});

describe('команда из CMS', () => {
  it('getTeam делит на ядро и сеть, порядок — как заведены', async () => {
    await createMember(MEMBER_A);
    await createMember(MEMBER_B);
    await createMember(MEMBER_C);

    await expect(getTeam('ru')).resolves.toMatchObject({
      core: [expected(MEMBER_A), expected(MEMBER_C)],
      network: [expected(MEMBER_B)],
    });
  });

  it('getTeam читает без входа (overrideAccess: false)', async () => {
    const admin = await createAdmin();

    await createMember(MEMBER_A, { user: admin });
    await createMember(MEMBER_B, { user: admin });

    /** `team.read` открыт всем → без флага результат тот же, поэтому флаг проверяется в самом вызове. */
    const find = vi.spyOn(payload, 'find');

    try {
      await expect(getTeam('ru')).resolves.toMatchObject({
        core: [expected(MEMBER_A)],
        network: [expected(MEMBER_B)],
      });
      expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'team', overrideAccess: false }));
    } finally {
      find.mockRestore();
    }
  });

  it('getTeam отдает язык: имя, «о себе» и skills на en, пустой en — русский', async () => {
    const memberA = await createMember(MEMBER_A);

    await translateMember(memberA.id, { name: 'Test Member A', about: 'Leads the project', skills: ['Copy'] });
    await createMember(MEMBER_C);

    await expect(getTeam('en')).resolves.toMatchObject({
      core: [
        { name: 'Test Member A', about: 'Leads the project', skills: ['Copy'] },
        { name: MEMBER_C.name, about: MEMBER_C.about, skills: MEMBER_C.skills },
      ],
      network: [],
    });
  });

  it('getTeam: фото — CaseImage со srcSet, без фото — null', async () => {
    const photo = await createImage('team-member-a');

    await createMember({ ...MEMBER_A, photo: photo.id });
    await createMember(MEMBER_C);

    await expect(getTeam('ru')).resolves.toMatchObject({
      core: [
        { name: MEMBER_A.name, photo: { url: expect.stringMatching(/\S/), srcSet: expect.stringMatching(/\S/) } },
        { name: MEMBER_C.name, photo: null },
      ],
    });
  });

  it('getTeam: пустые «о себе» и навыки', async () => {
    await createMember({ name: 'Тестовый Без Текста', role: 'developer', core: true, yearsSince: 2014 });
    await createMember({
      name: 'Тестовый Пробелы',
      role: 'designer',
      core: true,
      yearsSince: 2017,
      about: '   ',
      skills: ['Figma', '  '],
    });

    await expect(getTeam('ru')).resolves.toMatchObject({
      core: [
        { name: 'Тестовый Без Текста', about: null, skills: [] },
        { name: 'Тестовый Пробелы', about: null, skills: ['Figma'] },
      ],
    });
  });

  it('getTeam: порядок — как заведены, не по имени и не по году', async () => {
    const people = [
      { name: 'Тестовый Борис', yearsSince: 2010 },
      { name: 'Тестовый Яков', yearsSince: 2020 },
      { name: 'Тестовый Антон', yearsSince: 2015 },
    ];

    for (const { name, yearsSince } of people) {
      await createMember({ name, role: 'developer', core: true, yearsSince });
    }

    const { core } = await getTeam('ru');

    expect(core.map(({ name }) => name)).toEqual(['Тестовый Борис', 'Тестовый Яков', 'Тестовый Антон']);
  });

  it('getTeam: пустая коллекция', async () => {
    await expect(getTeam('ru')).resolves.toEqual({ core: [], network: [] });
  });
});
