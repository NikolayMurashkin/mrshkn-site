import config from '@payload-config';
import { getPayload, ValidationError, type Payload, type RequiredDataFromCollectionSlug } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCaseBySlug, getCases, hasCases } from '@/cms/cases';
import { Role } from '@/cms/consts';

const PASSWORD = 'integration-password';

/** Отказ Payload по правам доступа, а не по любой другой причине. */
const FORBIDDEN = { status: 403 };

let payload: Payload;

beforeAll(async () => {
  payload = await getPayload({ config });
});

afterAll(async () => {
  await payload.destroy();
});

/** Обложка и скрин Lighthouse кейса лежат в медиатеке: картинку для теста рисует sharp. */
const createImage = async (name: string) => {
  const data = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#2f5bea' } })
    .png()
    .toBuffer();

  return payload.create({
    collection: 'media',
    locale: 'ru',
    data: { alt: `Картинка ${name}` },
    file: { data, mimetype: 'image/png', name: `${name}.png`, size: data.length },
  });
};

type CaseData = RequiredDataFromCollectionSlug<'cases'>;

/**
 * Опубликованный кейс без скрина Lighthouse и ссылки на демо не сохраняется → опубликованному они добавляются,
 * если тест не передал их сам. Поле со значением `undefined` — «не передано»: его в данных нет совсем.
 */
const publishFields = async (data: Record<string, unknown>) => {
  if ((data._status ?? 'published') !== 'published') {
    return {};
  }

  return {
    ...('lighthouse' in data ? {} : { lighthouse: (await createImage(`lighthouse-${String(data.slug)}`)).id }),
    ...('demoUrl' in data ? {} : { demoUrl: 'https://example.com' }),
  };
};

/** Кейс с обязательной обложкой; статус по умолчанию — опубликован, черновик передается явно. */
const caseData = async (data: Record<string, unknown>) => {
  const cover = await createImage(`cover-${String(data.slug)}`);
  const merged = { cover: cover.id, _status: 'published', ...(await publishFields(data)), ...data };

  return Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined)) as unknown as CaseData;
};

type CaseDetailResult = {
  title: string;
  task: string;
  solution: string;
  metrics: { value: string; label: string }[];
  cover: { url: string };
  lighthouse: { url: string } | null;
  stack: string[];
  appUrl: string | null;
} | null;

/** Отказ сохранения: `ValidationError` Payload или то, чем обернулся промис, если сохранение прошло. */
const rejectionOf = (promise: Promise<unknown>) =>
  promise.then(
    (document) => ({ saved: document }),
    (error: unknown) => error,
  );

/** Поля, которые назвала ошибка проверки. */
const errorPaths = (error: unknown) =>
  error instanceof ValidationError ? error.data.errors.map(({ path }) => path) : [];

/** Кейс по адресу в базе в любом статусе — в обход прав, вместе с черновиками. */
const findAnyCase = async (slug: string) =>
  (
    await payload.find({
      collection: 'cases',
      where: { slug: { equals: slug } },
      overrideAccess: true,
      draft: true,
      pagination: false,
    })
  ).docs;

const createUser = (email: string, role: Role) =>
  payload.create({ collection: 'users', data: { email, password: PASSWORD, role } });

/** Форма первого входа в админку роль не присылает: поле правит только администратор, а его еще нет. */
const createUserWithoutRole = (email: string) =>
  payload.create({
    collection: 'users',
    data: { email, password: PASSWORD } as RequiredDataFromCollectionSlug<'users'>,
  });

describe('кейсы', () => {
  it('кейс, созданный через Local API, приходит во фронт через getPayload на обоих языках', async () => {
    const created = await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Проверочный кейс',
        slug: 'proverochnyj-kejs',
        kind: 'demo',
        niche: 'clinic',
        design: 'swiss',
        demoUrl: 'https://dental.mrshkn.com',
      }),
    });

    await payload.update({ collection: 'cases', id: created.id, locale: 'en', data: { title: 'Test case' } });

    expect(await getCases('ru')).toContainEqual(
      expect.objectContaining({
        slug: 'proverochnyj-kejs',
        title: 'Проверочный кейс',
        kind: 'demo',
        niche: 'clinic',
        design: 'swiss',
        demoUrl: 'https://dental.mrshkn.com',
      }),
    );
    expect(await getCases('en')).toContainEqual(
      expect.objectContaining({ slug: 'proverochnyj-kejs', title: 'Test case' }),
    );
  });

  it('закрытый от анонима кейс не приходит через getCases, опубликованный приходит', async () => {
    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Опубликованный кейс',
        slug: 'opublikovannyj-kejs',
        kind: 'demo',
        niche: 'horeca',
        design: 'pop',
      }),
    });
    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Черновик кейса',
        slug: 'chernovik-kejsa',
        kind: 'demo',
        niche: 'horeca',
        design: 'pop',
        _status: 'draft',
      }),
    });

    const slugs = (await getCases('ru')).map((item) => item.slug);

    expect(slugs).toContain('opublikovannyj-kejs');
    expect(slugs).not.toContain('chernovik-kejsa');
  });

  it('getCaseBySlug отдает опубликованный кейс целиком, а черновик и несуществующий адрес — null', async () => {
    const lighthouse = await createImage('lighthouse-detail');

    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Кейс со страницей',
        slug: 'kejs-so-straniczej',
        kind: 'demo',
        niche: 'startup',
        design: 'terminal',
        task: 'Запустить лендинг за две недели',
        solution: 'Собрали сайт на Next.js и Payload',
        metrics: [
          { value: '98', label: 'Performance' },
          { value: '100', label: 'Accessibility' },
        ],
        lighthouse: lighthouse.id,
      }),
    });
    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Скрытая страница кейса',
        slug: 'skrytyj-kejs',
        kind: 'client',
        niche: 'expert',
        design: 'swiss',
        _status: 'draft',
      }),
    });

    const published = (await getCaseBySlug('ru', 'kejs-so-straniczej')) as CaseDetailResult;

    expect(published).toMatchObject({
      title: 'Кейс со страницей',
      task: 'Запустить лендинг за две недели',
      solution: 'Собрали сайт на Next.js и Payload',
      metrics: [
        { value: '98', label: 'Performance' },
        { value: '100', label: 'Accessibility' },
      ],
    });
    expect(published?.cover.url).toEqual(expect.stringMatching(/\S/));
    expect(published?.lighthouse?.url).toEqual(expect.stringMatching(/\S/));
    expect(await getCaseBySlug('ru', 'skrytyj-kejs')).toBeNull();
    expect(await getCaseBySlug('ru', 'net-takogo')).toBeNull();
  });

  it('hasCases не видит черновик и кейс без обложки, видит опубликованный с обложкой', async () => {
    await payload.delete({ collection: 'cases', where: { id: { exists: true } } });

    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Черновик меню',
        slug: 'chernovik-menyu',
        kind: 'demo',
        niche: 'other',
        design: 'kinetic',
        _status: 'draft',
      }),
    });
    const withoutCover = await payload.create({
      collection: 'cases',
      locale: 'ru',
      depth: 0,
      data: await caseData({
        title: 'Без обложки',
        slug: 'bez-oblozhki',
        kind: 'demo',
        niche: 'other',
        design: 'kinetic',
      }),
    });

    await payload.delete({ collection: 'media', id: withoutCover.cover as number });

    expect(await hasCases('ru')).toBe(false);

    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'С обложкой',
        slug: 's-oblozhkoj',
        kind: 'demo',
        niche: 'other',
        design: 'kinetic',
      }),
    });

    expect(await hasCases('ru')).toBe(true);
  });
});

describe('проверка публикации кейса', () => {
  const CASE_BASE = { kind: 'demo', niche: 'clinic', design: 'swiss' } as const;

  it('опубликованный кейс без скрина Lighthouse не сохраняется, ошибка у поля lighthouse', async () => {
    const error = await rejectionOf(
      payload.create({
        collection: 'cases',
        locale: 'ru',
        data: await caseData({
          ...CASE_BASE,
          title: 'Без скрина',
          slug: 'publikaciya-bez-skrina',
          demoUrl: 'https://example.com',
          lighthouse: undefined,
        }),
      }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(errorPaths(error)).toContain('lighthouse');
    expect(errorPaths(error)).not.toContain('demoUrl');
    expect(await findAnyCase('publikaciya-bez-skrina')).toEqual([]);
  });

  it.each([
    ['не передана', 'ne-peredana', undefined],
    ['пустая строка', 'pustaya-stroka', ''],
    ['одни пробелы', 'odni-probely', '   '],
  ])(
    'опубликованный кейс без ссылки на демо (%s) не сохраняется, ошибка у поля demoUrl',
    async (_, suffix, demoUrl) => {
      const slug = `publikaciya-bez-demo-${suffix}`;
      const lighthouse = await createImage(`lighthouse-${slug}`);

      const error = await rejectionOf(
        payload.create({
          collection: 'cases',
          locale: 'ru',
          data: await caseData({ ...CASE_BASE, title: 'Без демо', slug, lighthouse: lighthouse.id, demoUrl }),
        }),
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(errorPaths(error)).toContain('demoUrl');
      expect(errorPaths(error)).not.toContain('lighthouse');
      expect(await findAnyCase(slug)).toEqual([]);
    },
  );

  it('черновик без скрина и без ссылки на демо сохраняется', async () => {
    const draft = await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        ...CASE_BASE,
        title: 'Черновик без всего',
        slug: 'chernovik-bez-vsego',
        _status: 'draft',
      }),
    });

    expect(draft._status).toBe('draft');
    expect(draft.lighthouse ?? null).toBeNull();
    expect(draft.demoUrl ?? null).toBeNull();
  });

  it('черновик без скрина и ссылки не публикуется: ошибка у обоих полей, кейс остается черновиком', async () => {
    const draft = await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        ...CASE_BASE,
        title: 'Черновик на публикацию',
        slug: 'chernovik-na-publikaciyu',
        _status: 'draft',
      }),
    });

    const error = await rejectionOf(
      payload.update({ collection: 'cases', id: draft.id, locale: 'ru', data: { _status: 'published' } }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(errorPaths(error)).toEqual(expect.arrayContaining(['lighthouse', 'demoUrl']));
    expect(await getCaseBySlug('ru', 'chernovik-na-publikaciyu')).toBeNull();
  });

  it('черновик со скрином и ссылкой публикуется одним _status и приходит в getCaseBySlug', async () => {
    const lighthouse = await createImage('lighthouse-chernovik-polnyj');
    const draft = await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        ...CASE_BASE,
        title: 'Полный черновик',
        slug: 'chernovik-polnyj',
        lighthouse: lighthouse.id,
        demoUrl: 'https://polnyj.mrshkn.com',
        _status: 'draft',
      }),
    });

    const published = await payload.update({
      collection: 'cases',
      id: draft.id,
      locale: 'ru',
      data: { _status: 'published' },
    });

    expect(published._status).toBe('published');
    expect(await getCaseBySlug('ru', 'chernovik-polnyj')).toMatchObject({ demoUrl: 'https://polnyj.mrshkn.com' });
  });

  it('опубликованный кейс со скрином и ссылкой на демо сохраняется и приходит в getCases', async () => {
    const lighthouse = await createImage('lighthouse-publikaciya-polnaya');

    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        ...CASE_BASE,
        title: 'Полный кейс',
        slug: 'publikaciya-polnaya',
        lighthouse: lighthouse.id,
        demoUrl: 'https://dental.mrshkn.com',
      }),
    });

    expect(await getCases('ru')).toContainEqual(
      expect.objectContaining({ slug: 'publikaciya-polnaya', demoUrl: 'https://dental.mrshkn.com' }),
    );
  });
});

describe('стек, Mini App и направление кейса', () => {
  const STACK = ['Next.js', 'Payload', 'PostgreSQL'];

  const APP_URL = 'https://app.example.com';

  it('стек и ссылка на Mini App сохраняются и приходят в getCaseBySlug на обоих языках', async () => {
    const created = await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Кейс со стеком',
        slug: 'kejs-so-stekom',
        kind: 'demo',
        niche: 'startup',
        design: 'kinetic',
        stack: STACK,
        appUrl: APP_URL,
      }),
    });

    await payload.update({ collection: 'cases', id: created.id, locale: 'en', data: { title: 'Case with a stack' } });

    const ru = (await getCaseBySlug('ru', 'kejs-so-stekom')) as CaseDetailResult;
    const en = (await getCaseBySlug('en', 'kejs-so-stekom')) as CaseDetailResult;

    expect(ru).toMatchObject({ title: 'Кейс со стеком', stack: STACK, appUrl: APP_URL });
    expect(en).toMatchObject({ title: 'Case with a stack', stack: STACK, appUrl: APP_URL });
  });

  it('кейс без направления сохраняется и приходит в getCases с design: null', async () => {
    await expect(
      payload.create({
        collection: 'cases',
        locale: 'ru',
        data: await caseData({ title: 'Кейс без стиля', slug: 'kejs-bez-stilya', kind: 'demo', niche: 'other' }),
      }),
    ).resolves.toMatchObject({ slug: 'kejs-bez-stilya' });

    expect(await getCases('ru')).toContainEqual(expect.objectContaining({ slug: 'kejs-bez-stilya', design: null }));
  });

  it('кейс без стека и ссылки на Mini App отдает пустой стек и null', async () => {
    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Кейс без стека',
        slug: 'kejs-bez-steka',
        kind: 'client',
        niche: 'expert',
        design: 'pop',
      }),
    });

    expect(await getCaseBySlug('ru', 'kejs-bez-steka')).toMatchObject({ stack: [], appUrl: null });
  });

  it('пробелы по краям технологий срезаются, пустые технологии и appUrl из пробелов не приходят', async () => {
    await payload.create({
      collection: 'cases',
      locale: 'ru',
      data: await caseData({
        title: 'Кейс с пробелами',
        slug: 'kejs-s-probelami',
        kind: 'demo',
        niche: 'other',
        design: 'swiss',
        stack: [' Next.js ', '   ', 'Payload'],
        appUrl: '   ',
      }),
    });

    expect(await getCaseBySlug('ru', 'kejs-s-probelami')).toMatchObject({
      stack: ['Next.js', 'Payload'],
      appUrl: null,
    });
  });
});

describe('роли', () => {
  it('первый пользователь становится admin, следующие по умолчанию editor', async () => {
    await payload.delete({ collection: 'users', where: {} });

    const first = await createUserWithoutRole('first@example.com');
    const second = await createUserWithoutRole('second@example.com');

    expect(first.role).toBe(Role.Admin);
    expect(second.role).toBe(Role.Editor);
  });

  it('editor не может менять settings, admin может', async () => {
    const admin = await createUser('settings-admin@example.com', Role.Admin);
    const editor = await createUser('settings-editor@example.com', Role.Editor);

    await payload.updateGlobal({
      slug: 'settings',
      data: { email: 'hello@mrshkn.com' },
      user: admin,
      overrideAccess: false,
    });

    await expect(
      payload.updateGlobal({
        slug: 'settings',
        data: { email: 'editor@example.com' },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject(FORBIDDEN);

    expect((await payload.findGlobal({ slug: 'settings' })).email).toBe('hello@mrshkn.com');
  });

  it('editor не может назначить себе роль admin и завести пользователя', async () => {
    const editor = await createUser('self-promotion@example.com', Role.Editor);

    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { role: Role.Admin },
      user: editor,
      overrideAccess: false,
    });

    expect(updated.role).toBe(Role.Editor);
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'invited@example.com', password: PASSWORD, role: Role.Editor },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject(FORBIDDEN);
  });

  it('editor ведет посты и кейсы', async () => {
    const editor = await createUser('content-editor@example.com', Role.Editor);
    const asEditor = { user: editor, overrideAccess: false } as const;

    await expect(
      payload.create({
        collection: 'posts',
        data: { title: 'Пост редактора', slug: 'post-redaktora', _status: 'published' },
        ...asEditor,
      }),
    ).resolves.toMatchObject({ _status: 'published' });
    await expect(
      payload.create({
        collection: 'cases',
        data: await caseData({
          title: 'Кейс редактора',
          slug: 'kejs-redaktora',
          kind: 'client',
          niche: 'expert',
          design: 'editorial',
        }),
        ...asEditor,
      }),
    ).resolves.toMatchObject({ slug: 'kejs-redaktora' });
  });
});

describe('посты', () => {
  it('черновик виден только в админке, опубликованный — всем', async () => {
    await payload.create({ collection: 'posts', data: { title: 'Черновик', slug: 'chernovik', _status: 'draft' } });
    await payload.create({
      collection: 'posts',
      data: { title: 'Опубликованный', slug: 'opublikovannyj', _status: 'published' },
    });

    const visible = await payload.find({ collection: 'posts', overrideAccess: false, pagination: false });
    const slugs = visible.docs.map((post) => post.slug);

    expect(slugs).toContain('opublikovannyj');
    expect(slugs).not.toContain('chernovik');
  });
});

describe('адрес записи', () => {
  it('пустой адрес заполняется из заголовка, а набранный руками приводится к латинице', async () => {
    const fromTitle = await payload.create({
      collection: 'posts',
      data: { title: 'Как мы делаем сайты за 14 дней' } as RequiredDataFromCollectionSlug<'posts'>,
    });
    const typed = await payload.create({
      collection: 'posts',
      data: { title: 'Второй пост', slug: 'Мой Пост!' },
    });

    expect(fromTitle.slug).toBe('kak-my-delaem-sayty-za-14-dney');
    expect(typed.slug).toBe('moy-post');
  });

  it('адрес, из которого не выходит ни одной буквы, не сохраняется', async () => {
    await expect(
      payload.create({
        collection: 'cases',
        data: await caseData({ title: '---', slug: '---', kind: 'demo', niche: 'clinic', design: 'swiss' }),
      }),
    ).rejects.toMatchObject({ data: { errors: [expect.objectContaining({ path: 'slug' })] } });
  });
});

describe('медиатека', () => {
  it('картинка режется на размеры в webp и не растягивается', async () => {
    const data = await sharp({ create: { width: 2400, height: 1500, channels: 3, background: '#d94f14' } })
      .jpeg()
      .toBuffer();

    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Проверочная заливка' },
      file: { data, mimetype: 'image/jpeg', name: 'fill.jpg', size: data.length },
    });

    expect(media.sizes?.card).toMatchObject({ width: 960, height: 600, mimeType: 'image/webp' });
    expect(media.sizes?.wide).toMatchObject({ width: 1600, height: 1000, mimeType: 'image/webp' });

    const small = await sharp({ create: { width: 640, height: 400, channels: 3, background: '#1b1b1f' } })
      .png()
      .toBuffer();
    const smallMedia = await payload.create({
      collection: 'media',
      data: { alt: 'Маленькая заливка' },
      file: { data: small, mimetype: 'image/png', name: 'small.png', size: small.length },
    });

    expect(smallMedia.sizes?.card).toMatchObject({ width: null, filename: null });
    expect(smallMedia.sizes?.thumbnail).toMatchObject({ width: 400, height: 250 });
  });

  it('подпись картинки переводится', async () => {
    const data = await sharp({ create: { width: 800, height: 500, channels: 3, background: '#2f5bea' } })
      .jpeg()
      .toBuffer();
    const media = await payload.create({
      collection: 'media',
      locale: 'ru',
      data: { alt: 'Синяя заливка' },
      file: { data, mimetype: 'image/jpeg', name: 'blue.jpg', size: data.length },
    });

    await payload.update({ collection: 'media', id: media.id, locale: 'en', data: { alt: 'Blue fill' } });

    expect((await payload.findByID({ collection: 'media', id: media.id, locale: 'ru' })).alt).toBe('Синяя заливка');
    expect((await payload.findByID({ collection: 'media', id: media.id, locale: 'en' })).alt).toBe('Blue fill');
  });
});
