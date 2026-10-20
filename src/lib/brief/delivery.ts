import { saveLead } from '@/cms/leads';
import { SITE_URL } from '@/lib/consts';
import { envOf } from '@/lib/delivery/env';
import { sendMail } from '@/lib/delivery/mail';
import { sendTelegram } from '@/lib/delivery/telegram';
import { LEAD_ADMIN_PATH, LEAD_SAVE_TIMEOUT_MS } from './consts';
import { formatLead } from './lead';
import type { Lead, LeadChannel } from './types';

/**
 * Запись в базу не бросает: ее сбой — один из каналов, а не повод не звать бота и почту. Зависшая запись тоже сбой:
 * через `LEAD_SAVE_TIMEOUT_MS` бот и почта уходят без ссылки, таймер снимается, как только запись ответила.
 */
const recordLead = async (lead: Lead) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`запись заявки в базу не уложилась в ${LEAD_SAVE_TIMEOUT_MS / 1000} с`)),
      LEAD_SAVE_TIMEOUT_MS,
    );
  });

  try {
    return { id: await Promise.race([saveLead(lead), timeout]), error: null };
  } catch (error) {
    return { id: null, error };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Заявку теряет только молчание всех трех каналов. Запись в базу идет первой: бот и письмо несут ссылку на карточку
 * в админке; запись не удалась — уходит тот же текст без ссылки. Бот и почта идут параллельно, чтобы упавший канал
 * не уносил с собой второй; ошибки собираются и пишутся в лог.
 */
export const deliverLead = async (lead: Lead) => {
  const record = await recordLead(lead);
  const text =
    record.id === null
      ? formatLead(lead)
      : [formatLead(lead), '', `Карточка: ${SITE_URL}${LEAD_ADMIN_PATH}/${record.id}`].join('\n');

  const channels = [
    ['telegram', () => sendTelegram(text)],
    ['mail', () => sendMail({ to: envOf('LEAD_MAIL_TO'), subject: `Заявка с сайта: ${lead.name}`, text })],
  ] as const;

  const results = await Promise.allSettled(channels.map(([, send]) => send()));
  const failed: { channel: LeadChannel; error: unknown }[] = [
    ...(record.id === null ? [{ channel: 'crm' as const, error: record.error }] : []),
    ...results.flatMap((result, index) =>
      result.status === 'rejected' ? [{ channel: channels[index][0], error: result.reason }] : [],
    ),
  ];

  for (const { channel, error } of failed) {
    console.error(`Заявка не ушла в канал ${channel}:`, error);
  }

  return { delivered: channels.length + 1 - failed.length, failed: failed.map(({ channel }) => channel) };
};
