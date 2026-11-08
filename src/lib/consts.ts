export enum SiteEnv {
  Preview = 'preview',
  Production = 'production',
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Политика обработки персональных данных, путь без языка; на этот же адрес встанет текст после проверки юристом. */
export const PRIVACY_HREF = '/docs/privacy';

/** Публичная оферта на разработку сайта и памятка «Как мы работаем», пути без языка; есть только на русском. */
export const OFFER_HREF = '/docs/offer';

export const HOW_WE_WORK_HREF = '/docs/how-we-work';

/** Публичный адрес студии в Telegram: канал с открытыми личными сообщениями, кнопка подвала всех направлений. */
export const TELEGRAM_URL = 'https://t.me/mrshkn_studio';

/** Демо-сайты студии: открываются со страниц услуг, у каждой ниши отраслевого сайта — свое. */
export const DENTAL_DEMO_URL = 'https://dental.mrshkn.com';

export const EXPERT_DEMO_URL = 'https://expert.mrshkn.com';

export const COFFEE_DEMO_URL = 'https://coffee.mrshkn.com';

export const SALON_DEMO_URL = 'https://salon.mrshkn.com';

/** Пример лендинга: ссылка «Посмотреть пример» на странице лендинга. */
export const EVENT_DEMO_URL = 'https://event.mrshkn.com';

/** Боты демо-приложений «Клиника», «Кофейня» и «Салон красоты»: раздел «Попробовать» на странице Mini App. */
export const DENTAL_TELEGRAM_BOT_URL = 'https://t.me/mrshkn_dental_bot';

export const DENTAL_MAX_BOT_URL = 'https://max.ru/se14753310_bot?startapp';

export const COFFEE_TELEGRAM_BOT_URL = 'https://t.me/mrshkn_coffee_bot?startapp';

/** Бот салона без `?startapp`: приложение открывает кнопка меню бота. */
export const SALON_TELEGRAM_BOT_URL = 'https://t.me/mrshkn_salon_bot';
