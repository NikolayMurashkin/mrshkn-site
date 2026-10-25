import { THREE_D_PLAN_ID } from '@/content/three-d';
import { COFFEE_TELEGRAM_BOT_URL, DENTAL_MAX_BOT_URL, DENTAL_TELEGRAM_BOT_URL, LAUNCH_DEMO_URL } from '@/lib/consts';
import type { TryItApp } from './types';

/** У поддержки нет раундов правок: вместо них часы по тарифу. */
export const SERVICES_WITHOUT_REVISIONS: readonly string[] = ['support'];

/** Услуги с абонплатой: цена за месяц. */
export const MONTHLY_SERVICES: readonly string[] = ['support'];

/** Тариф поддержки: его цену называют условия 3D — чем продолжается работа после гарантии. */
export const SUPPORT_PLAN_ID = 'support';

/** Приложение в Telegram под заказ: у него свой список «Что входит» и раздел «Попробовать». */
export const MINI_APP_PLAN_ID = 'miniApp';

/** Пример готовой работы в шапке страницы услуги: «Посмотреть пример» есть только у лендинга. */
export const SERVICE_EXAMPLES: Record<string, string> = {
  landing: LAUNCH_DEMO_URL,
};

/**
 * Демо-приложения раздела «Попробовать» в порядке карточек: ключ — тексты `servicePage.tryIt.apps.<id>`,
 * у каждой ссылки подпись `servicePage.tryIt.<messenger>`. «Кофейни» в MAX пока нет.
 */
export const TRY_IT_APPS: readonly TryItApp[] = [
  {
    id: 'clinic',
    links: [
      { messenger: 'telegram', href: DENTAL_TELEGRAM_BOT_URL },
      { messenger: 'max', href: DENTAL_MAX_BOT_URL },
    ],
  },
  {
    id: 'coffee',
    links: [{ messenger: 'telegram', href: COFFEE_TELEGRAM_BOT_URL }],
  },
];

/**
 * У «Что входит» свой список (`services.<id>.basics`) вместо базы сайта из 13 пунктов: у поддержки — работы
 * за месяц, у 3D — сцена и встраивание, без домена, хостинга, аналитики и адаптива сайта, у приложения
 * в Telegram — бот, админка и сервер приложения вместо домена, адаптива и поиска сайта.
 */
export const OWN_BASICS_SERVICES: readonly string[] = [SUPPORT_PLAN_ID, THREE_D_PLAN_ID, MINI_APP_PLAN_ID];

/**
 * Что повторяется в карточке тарифа из базы: у поддержки срока, Lighthouse и гарантии на запуск нет;
 * у 3D замер Lighthouse свой — он в условиях 3D, а не пункт базы сайта.
 */
export const SERVICE_CARD_POINTS: Record<string, readonly string[]> = {
  default: ['deadline', 'lighthouse', 'warranty'],
  [SUPPORT_PLAN_ID]: [],
  [THREE_D_PLAN_ID]: ['deadline', 'warranty'],
};

export const CARD_POINT_KEYS: Record<string, string> = {
  deadline: 'servicePage.cardPoints.deadline',
  lighthouse: 'pricing.basics.lighthouse',
  warranty: 'servicePage.cardPoints.warranty',
};
