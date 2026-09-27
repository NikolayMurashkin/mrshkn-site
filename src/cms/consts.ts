import { BRIEF_STEP_VALUES } from '../lib/brief/consts';

export enum Role {
  Admin = 'admin',
  Editor = 'editor',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.Admin]: 'Администратор',
  [Role.Editor]: 'Редактор',
};

/**
 * Каталог медиатеки Payload. Путь относительный, и Payload отдает его файловой системе как есть, то есть
 * от рабочего каталога процесса — корня репозитория локально и `/app` в образе. Это данные CMS, а не исходники,
 * поэтому каталог в git не попадает.
 */
export const DEFAULT_MEDIA_DIR = 'media';

/** Интеграционные тесты работают со своей медиатекой во временном каталоге. */
export const MEDIA_DIR = process.env.MEDIA_DIR ?? DEFAULT_MEDIA_DIR;

/**
 * Размеры, которые Payload нарезает из каждой загруженной картинки: превью админки, карточка и полоса во всю
 * ширину. Высота считается по пропорциям оригинала, а картинку меньше размера Payload не растягивает.
 */
export const MEDIA_SIZES = [
  { name: 'thumbnail', width: 400 },
  { name: 'card', width: 960 },
  { name: 'wide', width: 1600 },
] as const;

export const MEDIA_FORMAT = { format: 'webp', options: { quality: 80 } } as const;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Транслит для адресов: заголовок «Как мы работаем» дает `kak-my-rabotaem`. */
export const SLUG_TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export const CASE_KINDS = ['demo', 'client'] as const;

export const CASE_KIND_LABELS: Record<(typeof CASE_KINDS)[number], string> = {
  demo: 'Демо-проект студии',
  client: 'Клиент',
};

/** Ниши те же, что на втором шаге квиза. */
export const CASE_NICHES = BRIEF_STEP_VALUES.niche;

/** Роли людей в проекте — секция «Команда и процесс». */
export const TEAM_ROLES = ['lead', 'designer', 'copywriter', 'developer', 'qa'] as const;

export const TEAM_ROLE_LABELS: Record<(typeof TEAM_ROLES)[number], string> = {
  lead: 'Лид проекта',
  designer: 'Дизайнер',
  copywriter: 'Копирайтер',
  developer: 'Разработчик',
  qa: 'Тестировщик',
};
