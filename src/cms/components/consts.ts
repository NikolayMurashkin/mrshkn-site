export const REVIEW_INVITE_API = '/api/review/invite';

/** Подписи кнопки и тостов: интерфейс админки только русский. */
export const REVIEW_INVITE_TEXT = {
  send: 'Отправить приглашение',
  renew: 'Продлить и отправить снова',
  sending: 'Отправляем…',
  sent: 'Письмо ушло клиенту, ссылка действует до',
  failed: {
    mail: 'Письмо не ушло: почтовый сервер не ответил. Приглашение не отмечено отправленным.',
    conflict: 'Состояние приглашения изменилось. Обновите страницу.',
    other: 'Приглашение не отправлено. Обновите страницу и попробуйте еще раз.',
  },
} as const;

/** Адрес отчета по каналам внутри админки и в ее меню. */
export const CHANNEL_REPORT_PATH = '/channel-report';

export const CHANNEL_REPORT_TEXT = {
  title: 'Отчет по каналам',
  navGroup: 'Отчеты',
  from: 'С',
  to: 'По',
  submit: 'Показать',
  period: 'Время московское: заявки — по дате создания, расходы — по дате расхода',
  total: 'Итого',
  empty: 'За период нет заявок и расходов',
  overKpi: (limit: string) => `Выделена цена квалифицированной заявки дороже ${limit} — выше KPI рекламы`,
} as const;

/** Столбцы отчета после столбца канала: ключ строки и заголовок. */
export const CHANNEL_REPORT_COLUMNS = [
  { key: 'leads', label: 'Заявки' },
  { key: 'qualified', label: 'Квалифицированные' },
  { key: 'contracts', label: 'Договоры' },
  { key: 'revenue', label: 'Выручка' },
  { key: 'spend', label: 'Расход' },
  { key: 'cpl', label: 'CPL' },
  { key: 'costPerQualified', label: 'Цена квалифицированной' },
  { key: 'payback', label: 'Окупаемость' },
] as const;

export const CHANNEL_REPORT_SOURCE_LABEL = 'Канал';
