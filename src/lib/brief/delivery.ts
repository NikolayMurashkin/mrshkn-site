import { createTransport } from 'nodemailer';
import { UTM_PARAMS } from './consts';
import { formatLead } from './lead';
import type { Lead } from './types';

const TELEGRAM_API_FALLBACK = 'https://api.telegram.org';

const envOf = (name: string) => process.env[name]?.trim() ?? '';

const sendTelegram = async (lead: Lead, text: string) => {
  const token = envOf('TELEGRAM_BOT_TOKEN');
  const chats = envOf('TELEGRAM_CHAT_IDS')
    .split(',')
    .map((chat) => chat.trim())
    .filter(Boolean);

  if (!token || !chats.length) {
    throw new Error('Telegram не настроен: нет токена бота или списка чатов');
  }

  const api = envOf('TELEGRAM_API_URL') || TELEGRAM_API_FALLBACK;

  await Promise.all(
    chats.map(async (chat) => {
      const response = await fetch(`${api}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      });

      if (!response.ok) {
        throw new Error(`Telegram ответил ${response.status}`);
      }
    }),
  );
};

const sendMail = async (lead: Lead, text: string) => {
  const url = envOf('SMTP_URL');
  const to = envOf('LEAD_MAIL_TO');
  const from = envOf('LEAD_MAIL_FROM') || to;

  if (!url || !to) {
    throw new Error('Почта не настроена: нет строки SMTP или адреса получателя');
  }

  await createTransport(url).sendMail({
    from,
    to,
    subject: `Заявка с сайта: ${lead.name}`,
    text,
  });
};

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
    ['telegram', sendTelegram],
    ['mail', sendMail],
    ['bitrix', sendBitrix],
  ] as const;

  const results = await Promise.allSettled(channels.map(([, send]) => send(lead, text)));
  const failed = results.flatMap((result, index) =>
    result.status === 'rejected' ? [{ channel: channels[index][0], error: result.reason }] : [],
  );

  for (const { channel, error } of failed) {
    console.error(`Заявка не ушла в канал ${channel}:`, error);
  }

  return { delivered: results.length - failed.length, failed: failed.map(({ channel }) => channel) };
};
