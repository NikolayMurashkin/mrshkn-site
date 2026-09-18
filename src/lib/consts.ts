export enum SiteEnv {
  Preview = 'preview',
  Production = 'production',
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
