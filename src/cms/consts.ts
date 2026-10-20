import { BRIEF_STEP_VALUES } from '../lib/brief/consts';
import type { SiteLocale } from '../i18n/types';
import type { LeadStage } from '../lib/brief/types';
import type { ReviewStatus } from '../lib/review/types';

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
const DEFAULT_MEDIA_DIR = 'media';

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

export const SLUG_ADMIN = {
  description: 'Заполнится из заголовка, если оставить пустым. Кириллица станет латиницей.',
};

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

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  invited: 'Приглашение',
  received: 'Получен',
  published: 'Опубликован',
  rejected: 'Отклонен',
  withdrawn: 'Согласие отозвано',
};

export const REVIEW_LOCALE_LABELS: Record<SiteLocale, string> = {
  ru: 'Русский',
  en: 'Английский',
};

/** Кнопка отправки приглашения в карточке отзыва: путь от `src`, как его пишет карта импорта админки. */
export const REVIEW_INVITE_BUTTON = '/cms/components/ReviewInviteButton#ReviewInviteButton';

/** Что стирает отзыв согласия: все, что написал автор, перевод и «другое» из запретов; отметки запретов остаются. */
export const REVIEW_ERASED_FIELDS = {
  fullName: null,
  signature: null,
  occupation: null,
  link: null,
  answers: { before: null, process: null, after: null },
  translation: { text: null, approved: false, approvedAt: null },
  restrictions: { other: null },
};

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: 'Новая',
  qualified: 'Квалифицирована',
  proposal: 'КП',
  contract: 'Договор',
  work: 'В работе',
  delivered: 'Сдан',
  rejected: 'Отказ',
};

/** Предел текста напоминания в карточке заявки: короткая строка для сообщения бота, не вторые заметки. */
export const LEAD_REMIND_TEXT_MAX = 500;

/** Задача проверки сроков напоминаний и ее очередь в Payload. */
export const LEAD_REMINDERS_TASK = 'leadReminders';

export const CRM_QUEUE = 'crm';

/**
 * Расписание ставит проверку сроков в очередь каждые 5 минут, очередь прогоняется каждую минуту: напоминание уходит
 * не позже чем через 6 минут после срока при обещанных 15.
 */
export const LEAD_REMINDERS_CRON = '*/5 * * * *';

export const CRM_QUEUE_CRON = '* * * * *';

/** Метка в `context` сохранения: отметку «напоминание отправлено» ставит задача, а не правка карточки. */
export const LEAD_REMINDER_SENT = 'leadReminderSent';
