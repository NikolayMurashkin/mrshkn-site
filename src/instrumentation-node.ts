import { getPayload } from 'payload';
import config from './payload.config';

/**
 * Миграции (`MIGRATE_ON_START`) применяются до первой заявки, очередь задач по расписанию идет без посетителей —
 * ее cron Payload запускает только при `cron: true`. Подъем упал — выход с ненулевым кодом: хостинг не пустит трафик
 * на контейнер без базы и оставит прежний.
 */
export const startPayload = async () => {
  try {
    await getPayload({ config, cron: true });
  } catch (error) {
    console.error('Payload не поднялся при старте сайта:', error);
    process.exit(1);
  }
};
