import { getPayload, type Payload } from 'payload';
import sharp from 'sharp';
import config from '../src/payload.config';

/** Тот же адрес стоит в `lighthouserc.cjs`: конфиг на CommonJS не может импортировать эту константу. */
const SLUG = 'lighthouse-demo';

const MEDIA_NAME_PREFIX = 'lighthouse-seed';

const COVER = { name: `${MEDIA_NAME_PREFIX}-cover`, width: 1600, height: 1000, background: '#2f5bea' };

const SHOT = { name: `${MEDIA_NAME_PREFIX}-shot`, width: 1200, height: 800, background: '#1b1b1f' };

/** Нейтральные служебные тексты (D14): ни метрик, ни названий реальных проектов. */
const TEXTS = {
  ru: {
    title: 'Служебный кейс для замера',
    task: 'Служебный текст для замера Lighthouse. Он не описывает реальный проект.\n\nВторой абзац проверяет разбиение текста на абзацы.',
    solution:
      'Служебный текст решения. Он нужен, чтобы страница кейса была заполнена так же, как боевая.\n\nВторой абзац решения.',
    metrics: [
      { value: '1', label: 'Служебное значение 1' },
      { value: '2', label: 'Служебное значение 2' },
      { value: '3', label: 'Служебное значение 3' },
      { value: '4', label: 'Служебное значение 4' },
    ],
    coverAlt: 'Служебная обложка кейса',
    coverCaption: 'Служебная подпись к обложке',
    shotAlt: 'Служебный скрин отчета',
  },
  en: {
    title: 'Service case for measurement',
    task: 'Service text for the Lighthouse run. It does not describe a real project.\n\nThe second paragraph checks paragraph splitting.',
    solution:
      'Service text of the solution. It keeps the case page as full as a live one.\n\nThe second paragraph of the solution.',
    metrics: [
      { value: '1', label: 'Service value 1' },
      { value: '2', label: 'Service value 2' },
      { value: '3', label: 'Service value 3' },
      { value: '4', label: 'Service value 4' },
    ],
    coverAlt: 'Service case cover',
    coverCaption: 'Service cover caption',
    shotAlt: 'Service report screenshot',
  },
};

/**
 * Заведомо тестовый участник ядра: без людей в CMS главная секцию «Команда» не рисует, и Lighthouse ее бы не мерил.
 * Только база замера — на публичном сайте его нет; фото нет, чтобы не выдумывать лицо.
 */
const TEAM_MEMBER = {
  role: 'developer',
  yearsSince: 2015,
  ru: {
    name: 'Тестовый участник',
    about: 'Служебный текст для замера Lighthouse. Он не описывает реального человека.',
    skills: ['Служебный навык 1', 'Служебный навык 2', 'Служебный навык 3'],
  },
  en: {
    name: 'Test member',
    about: 'Service text for the Lighthouse run. It does not describe a real person.',
    skills: ['Service skill 1', 'Service skill 2', 'Service skill 3'],
  },
} as const;

type SeedImage = typeof COVER;

const createImage = async (payload: Payload, { name, width, height, background }: SeedImage, alt: typeof TEXTS) => {
  const data = await sharp({ create: { width, height, channels: 3, background } })
    .png()
    .toBuffer();
  const key = name === COVER.name ? 'coverAlt' : 'shotAlt';
  const media = await payload.create({
    collection: 'media',
    locale: 'ru',
    data: { alt: alt.ru[key] },
    file: { data, mimetype: 'image/png', name: `${name}.png`, size: data.length },
  });

  await payload.update({ collection: 'media', id: media.id, locale: 'en', data: { alt: alt.en[key] } });

  return media.id;
};

/**
 * Засев пересоздает кейс, его картинки и тестового участника с нуля: повторный запуск оставляет в базе один такой же
 * кейс и одного участника.
 */
const seed = async () => {
  const payload = await getPayload({ config });

  await payload.delete({ collection: 'cases', where: { slug: { equals: SLUG } } });
  await payload.delete({ collection: 'media', where: { filename: { like: MEDIA_NAME_PREFIX } } });
  await payload.delete({ collection: 'team', locale: 'ru', where: { name: { equals: TEAM_MEMBER.ru.name } } });

  const cover = await createImage(payload, COVER, TEXTS);
  const lighthouse = await createImage(payload, SHOT, TEXTS);

  const created = await payload.create({
    collection: 'cases',
    locale: 'ru',
    data: {
      title: TEXTS.ru.title,
      slug: SLUG,
      kind: 'demo',
      niche: 'other',
      design: 'kinetic',
      demoUrl: 'https://example.com',
      cover,
      coverCaption: TEXTS.ru.coverCaption,
      task: TEXTS.ru.task,
      solution: TEXTS.ru.solution,
      metrics: TEXTS.ru.metrics,
      lighthouse,
      _status: 'published',
    },
  });

  await payload.update({
    collection: 'cases',
    id: created.id,
    locale: 'en',
    data: {
      title: TEXTS.en.title,
      coverCaption: TEXTS.en.coverCaption,
      task: TEXTS.en.task,
      solution: TEXTS.en.solution,
      metrics: (created.metrics ?? []).map(({ id }, index) => ({ id, ...TEXTS.en.metrics[index] })),
    },
  });

  const member = await payload.create({
    collection: 'team',
    locale: 'ru',
    data: {
      name: TEAM_MEMBER.ru.name,
      role: TEAM_MEMBER.role,
      core: true,
      yearsSince: TEAM_MEMBER.yearsSince,
      about: TEAM_MEMBER.ru.about,
      skills: [...TEAM_MEMBER.ru.skills],
    },
  });

  await payload.update({
    collection: 'team',
    id: member.id,
    locale: 'en',
    data: { name: TEAM_MEMBER.en.name, about: TEAM_MEMBER.en.about, skills: [...TEAM_MEMBER.en.skills] },
  });

  await payload.destroy();
};

await seed();

process.exit(0);
