import type { LeadKind } from './types';

/** Обработчик формы «Проверьте свой сайт»: свой адрес, отказ — 400 (у квиза 422 и своя история тестов). */
export const AUDIT_API_HREF = '/api/audit';

/** Главная PageSpeed Insights: туда ведет «Проверить самому», пока адрес в форме пуст или не похож на сайт. */
export const PSI_HOME = 'https://pagespeed.web.dev/';

/** Отчет PageSpeed Insights по адресу: `url` — адрес сайта, `form_factor=mobile` — проверка для телефона. */
export const PSI_REPORT_URL = 'https://pagespeed.web.dev/report';

/** Длиннее адрес сайта не бывает на практике; длинная строка — мусор или попытка раздуть заявку. */
export const SITE_URL_MAX_LENGTH = 2000;

/** Схемы, которые можно проверить в тесте скорости: остальные (`ftp:`, `javascript:`, `mailto:`) — не сайт. */
export const SITE_URL_PROTOCOLS: readonly string[] = ['http:', 'https:'];

/** Схема, которую получает адрес, введенный без нее (`example.ru`). */
export const SITE_URL_DEFAULT_SCHEME = 'https://';

/** Вид заявки в CRM: квиз или бесплатный замер. Подписи — в админке. */
export const LEAD_KINDS = ['brief', 'audit'] as const;

export const LEAD_KIND_LABELS: Record<LeadKind, string> = {
  brief: 'Квиз',
  audit: 'Замер',
};
