import { TELEGRAM_API_FALLBACK } from './consts';
import { envOf } from './env';

/** Сообщение от бота студии в каждый чат из `TELEGRAM_CHAT_IDS`; ошибка любого чата — ошибка всей отправки. */
export const sendTelegram = async (text: string) => {
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
