'use client';

import { useGoal } from '@/components/Analytics/use-consent';
import { GOALS } from '@/lib/analytics/consts';
import { TELEGRAM_URL } from '@/lib/consts';
import type { TelegramLinkProps } from './types';

/**
 * Ссылка на студию в Telegram для подвала любого направления: адрес, новая вкладка и цель счетчиков в одном
 * месте, класс кнопки дает направление. Своего CSS нет → в чанки направлений не тянет чужих стилей.
 */
export const TelegramLink = ({ className, children }: TelegramLinkProps) => {
  const reachGoal = useGoal();

  return (
    <a
      className={className}
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => reachGoal(GOALS.telegramClick)}
    >
      {children}
    </a>
  );
};
