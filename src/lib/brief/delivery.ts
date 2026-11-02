import { saveLead } from '@/cms/leads';
import { SITE_URL } from '@/lib/consts';
import { envOf } from '@/lib/delivery/env';
import { sendMail } from '@/lib/delivery/mail';
import { sendTelegram } from '@/lib/delivery/telegram';
import { LEAD_ADMIN_PATH, LEAD_SAVE_TIMEOUT_MS } from './consts';
import { formatLead } from './lead';
import type { Lead, LeadChannel, LeadDelivery, LeadMessage, LeadRecord } from './types';

/**
 * Запись в базу не бросает: ее сбой — один из каналов, а не повод не звать бота и почту. Зависшая запись тоже сбой:
 * через `LEAD_SAVE_TIMEOUT_MS` бот и почта уходят без ссылки, таймер снимается, как только запись ответила.
 * `save` — запись заявки своего вида (квиз, замер), возвращает id карточки.
 */
const recordWith = async (save: () => Promise<number>): Promise<LeadRecord> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`запись заявки в базу не уложилась в ${LEAD_SAVE_TIMEOUT_MS / 1000} с`)),
      LEAD_SAVE_TIMEOUT_MS,
    );
  });

  try {
    return { id: await Promise.race([save(), timeout]), error: null };
  } catch (error) {
    return { id: null, error };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Бот и письмо после записи в базу: несут ссылку на карточку в админке, запись не удалась — тот же текст без ссылки.
 * Заявку теряет только молчание всех трех каналов. Бот и почта идут параллельно, чтобы упавший канал не уносил с собой
 * второй; ошибки, вместе со сбоем записи, собираются и пишутся в лог. Не бросает.
 */
const notifyWith = async ({ text: leadText, subject }: LeadMessage, record: LeadRecord) => {
  const text =
    record.id === null ? leadText : [leadText, '', `Карточка: ${SITE_URL}${LEAD_ADMIN_PATH}/${record.id}`].join('\n');

  const channels = [
    ['telegram', () => sendTelegram(text)],
    ['mail', () => sendMail({ to: envOf('LEAD_MAIL_TO'), subject, text })],
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

/**
 * Путь заявки любого вида: запись в базу, затем каналы. Заявка в базе — посетитель получает ответ сразу, бот и почта
 * уходят после ответа: медленный канал не держит форму, сбой остается строкой в логе. Запись не прошла — ответ ждет
 * каналы: только они и сохраняют заявку; молчат все — отказ. `later` — `after` из `next/server`, его передает
 * обработчик: модуль от Next не зависит; в `later` уходит функция, не промис — промис начал бы работу до ответа.
 */
export const deliverLead = async (
  save: () => Promise<number>,
  message: LeadMessage,
  later: (task: () => Promise<unknown>) => void,
): Promise<LeadDelivery> => {
  const record = await recordWith(save);

  if (record.id !== null) {
    later(() => notifyWith(message, record));

    return { ok: true };
  }

  const { delivered, failed } = await notifyWith(message, record);

  return delivered ? { ok: true } : { ok: false, failed };
};

/** Заявка квиза: запись в базу и каналы, текст — `formatLead`. */
export const deliverBriefLead = (lead: Lead, later: (task: () => Promise<unknown>) => void) =>
  deliverLead(() => saveLead(lead), { text: formatLead(lead), subject: `Заявка с сайта: ${lead.name}` }, later);
