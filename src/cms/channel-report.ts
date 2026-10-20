import { buildChannelReport, periodBounds } from '../lib/crm/report';
import type { ChannelReport } from '../lib/crm/types';
import type { GetChannelReportOptions } from './types';

/**
 * Отчет по каналам из базы: заявки по дате создания и расходы по своей дате в границах периода — тех же, по которым
 * фильтрует счет. Читается с правами пользователя: без входа Payload отказывает (`Forbidden`), а не отдает пустой отчет.
 */
export const getChannelReport = async ({ payload, user, period }: GetChannelReportOptions): Promise<ChannelReport> => {
  const { start, end } = periodBounds(period);
  const access = { overrideAccess: false, user, depth: 0, pagination: false } as const;

  const [leads, expenses] = await Promise.all([
    payload.find({
      collection: 'leads',
      where: { createdAt: { greater_than_equal: start, less_than: end } },
      select: { createdAt: true, utm_source: true, stage: true, qualifiedAt: true, amount: true },
      ...access,
    }),
    payload.find({
      collection: 'expenses',
      where: { date: { greater_than_equal: start, less_than: end } },
      select: { date: true, utm_source: true, amount: true },
      ...access,
    }),
  ]);

  return buildChannelReport(leads.docs, expenses.docs, period);
};
