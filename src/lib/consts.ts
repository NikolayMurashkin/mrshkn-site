export enum SiteEnv {
  Preview = 'preview',
  Production = 'production',
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Политика обработки персональных данных, путь без языка; на этот же адрес встанет текст после проверки юристом. */
export const PRIVACY_HREF = '/docs/privacy';
