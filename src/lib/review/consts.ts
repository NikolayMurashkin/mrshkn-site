/** Сколько живет ссылка-приглашение после отправки или продления. */
export const REVIEW_INVITE_TTL_MS = 60 * 24 * 60 * 60 * 1000;

/** Байт случайности в коде ссылки: 24 байта в base64url — 32 знака и 192 бита, с запасом над 128. */
export const REVIEW_CODE_BYTES = 24;

/** Редакция текстов согласия и разрешения: пишется в отзыв вместе с текстами, которые видел автор. */
export const REVIEW_CONSENT_VERSION = '0.1';

export const REVIEW_STATUSES = ['invited', 'received', 'published', 'rejected', 'withdrawn'] as const;

/** Статусы, при которых клиент свой отзыв уже прислал: ссылка показывает «отзыв получен». */
export const REVIEW_SENT_STATUSES: readonly string[] = ['received', 'published', 'rejected'];

/** Пределы длины полей формы: те же проверяет сервер. */
export const REVIEW_LIMITS = {
  short: 200,
  link: 500,
  answer: 4000,
  other: 500,
} as const;

/** Поля автора, без которых отзыв не принимается; ссылка необязательна. */
export const REVIEW_REQUIRED_FIELDS = ['fullName', 'signature', 'occupation'] as const;

export const REVIEW_ANSWERS = ['before', 'process', 'after'] as const;

/** Ответы, без которых отзыв не принимается; «что изменилось после запуска» можно пропустить — запишется пустым. */
export const REVIEW_REQUIRED_ANSWERS: readonly (typeof REVIEW_ANSWERS)[number][] = ['before', 'process'];

/** Ссылка автора — только http(s): `javascript:` и прочие схемы на сайт не попадут. */
export const REVIEW_LINK_PATTERN = /^https?:\/\/[^\s]+$/i;

export const REVIEW_API_HREF = '/api/review';

/** Адрес записи в админке: его получает уведомление в Telegram вместо данных автора. */
export const REVIEW_ADMIN_PATH = '/admin/collections/reviews';
