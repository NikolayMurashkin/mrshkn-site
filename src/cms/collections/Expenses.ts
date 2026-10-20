import type { CollectionConfig, PayloadHandler } from 'payload';
import { parsePeriod } from '../../lib/crm/report';
import { isSignedIn } from '../access';
import { getChannelReport } from '../channel-report';

/** Данные отчета по каналам за период из адреса; без входа загрузка отчета падает отказом, Payload отдает 403. */
const reportHandler: PayloadHandler = async (req) => {
  const period = parsePeriod({ from: req.searchParams.get('from'), to: req.searchParams.get('to') }, new Date());
  const { rows, total } = await getChannelReport({ payload: req.payload, user: req.user, period });

  return Response.json({ period, rows, total });
};

/**
 * Расходы на рекламу по каналам — для отчета по каналам: дата, `utm_source` и сумма заводятся руками. Видят и правят
 * их только вошедшие в админку, как и заявки. День выбирается в календаре без времени — Payload хранит его полднем
 * по UTC, и это тот же день по Москве.
 */
export const Expenses: CollectionConfig = {
  slug: 'expenses',
  labels: { singular: 'Расход', plural: 'Расходы' },
  admin: {
    useAsTitle: 'utm_source',
    defaultColumns: ['date', 'utm_source', 'amount'],
  },
  access: { read: isSignedIn, create: isSignedIn, update: isSignedIn, delete: isSignedIn },
  endpoints: [{ path: '/report', method: 'get', handler: reportHandler }],
  fields: [
    {
      name: 'date',
      type: 'date',
      label: 'Дата',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
    },
    {
      name: 'utm_source',
      type: 'text',
      label: 'Канал (utm_source)',
      required: true,
      admin: { description: 'Как в метке заявки: yandex, vk… Регистр и пробелы по краям не важны' },
    },
    { name: 'amount', type: 'number', label: 'Сумма, ₽', required: true, min: 0 },
  ],
};
