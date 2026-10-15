import { envOf } from '@/lib/delivery/env';
import { sendMail } from '@/lib/delivery/mail';
import { sendTelegram } from '@/lib/delivery/telegram';
import { UTM_PARAMS } from './consts';
import { formatLead } from './lead';
import type { Lead } from './types';

const sendBitrix = async (lead: Lead, text: string) => {
  const webhook = envOf('BITRIX_WEBHOOK_URL');

  if (!webhook) {
    throw new Error('Bitrix24 не настроен: нет адреса вебхука');
  }

  const marks = Object.fromEntries(
    UTM_PARAMS.filter((mark) => lead.marks[mark]).map((mark) => [mark.toUpperCase(), lead.marks[mark]]),
  );

  const response = await fetch(`${webhook.replace(/\/$/, '')}/crm.lead.add.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fields: {
        TITLE: `Сайт: ${lead.product} — ${lead.name}`,
        NAME: lead.name,
        SOURCE_ID: 'WEB',
        SOURCE_DESCRIPTION: lead.source,
        COMMENTS: text,
        ...marks,
      },
      params: { REGISTER_SONET_EVENT: 'Y' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Bitrix24 ответил ${response.status}`);
  }
};

/**
 * Заявку теряет только молчание всех трех каналов: упавший канал не должен уносить с собой остальные,
 * поэтому каналы идут параллельно, а ошибки собираются и пишутся в лог.
 */
export const deliverLead = async (lead: Lead) => {
  const text = formatLead(lead);
  const channels = [
    ['telegram', () => sendTelegram(text)],
    ['mail', () => sendMail({ to: envOf('LEAD_MAIL_TO'), subject: `Заявка с сайта: ${lead.name}`, text })],
    ['bitrix', () => sendBitrix(lead, text)],
  ] as const;

  const results = await Promise.allSettled(channels.map(([, send]) => send()));
  const failed = results.flatMap((result, index) =>
    result.status === 'rejected' ? [{ channel: channels[index][0], error: result.reason }] : [],
  );

  for (const { channel, error } of failed) {
    console.error(`Заявка не ушла в канал ${channel}:`, error);
  }

  return { delivered: results.length - failed.length, failed: failed.map(({ channel }) => channel) };
};
