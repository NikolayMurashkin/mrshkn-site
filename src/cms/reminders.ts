import type { TaskConfig, Where } from 'payload';
import { LEAD_ADMIN_PATH, LEAD_CLOSED_STAGES } from '../lib/brief/consts';
import type { LeadStage } from '../lib/brief/types';
import { SITE_URL } from '../lib/consts';
import { sendTelegram } from '../lib/delivery/telegram';
import type { Lead } from '../payload-types';
import { CRM_QUEUE, LEAD_REMINDER_SENT, LEAD_REMINDERS_CRON, LEAD_REMINDERS_TASK, LEAD_STAGE_LABELS } from './consts';

/** Сообщение бота по образцу сообщения о заявке: кто, на каком этапе, о чем напомнить и где карточка. */
export const formatReminder = ({ id, name, stage, remindText }: Pick<Lead, 'id' | 'name' | 'stage' | 'remindText'>) =>
  [
    `Напоминание: ${name}`,
    `Этап: ${LEAD_STAGE_LABELS[stage as LeadStage]}`,
    ...(remindText?.trim() ? [remindText.trim()] : []),
    '',
    `Карточка: ${SITE_URL}${LEAD_ADMIN_PATH}/${id}`,
  ].join('\n');

const dueReminders = (now: Date): Where => ({
  and: [
    { remindAt: { less_than_equal: now.toISOString() } },
    { remindSentAt: { exists: false } },
    { stage: { not_in: LEAD_CLOSED_STAGES } },
  ],
});

/**
 * Проверка сроков: каждое напоминание в срок — одно сообщение в чат заявок студии. Отметка ставится только после
 * ответа бота; сбой одной заявки пишется в лог, она остается неотправленной и уходит со следующим запуском, остальные
 * идут дальше. Задача при этом завершается успешно: следующий запуск по расписанию и есть повтор.
 */
export const LeadReminders: TaskConfig<{ input: object; output: object }> = {
  slug: LEAD_REMINDERS_TASK,
  label: 'Напоминания по заявкам',
  schedule: [{ cron: LEAD_REMINDERS_CRON, queue: CRM_QUEUE }],
  handler: async ({ req: { payload } }) => {
    const { docs } = await payload.find({
      collection: 'leads',
      where: dueReminders(new Date()),
      sort: 'remindAt',
      pagination: false,
      depth: 0,
      overrideAccess: true,
    });

    for (const lead of docs) {
      try {
        await sendTelegram(formatReminder(lead));
        await payload.update({
          collection: 'leads',
          id: lead.id,
          data: { remindSentAt: new Date().toISOString() },
          depth: 0,
          overrideAccess: true,
          context: { [LEAD_REMINDER_SENT]: true },
        });
      } catch (error) {
        console.error(`Напоминание по заявке ${lead.id} не ушло:`, error);
      }
    }

    return { output: {} };
  },
};
