import type { Metadata } from 'next';
import { SiteEnv } from './consts';

export const resolveSiteEnv = (value?: string | null): SiteEnv =>
  value === SiteEnv.Production ? SiteEnv.Production : SiteEnv.Preview;

export const getSiteEnv = (): SiteEnv => resolveSiteEnv(process.env.SITE_ENV);

export const robotsMetadata = (siteEnv: SiteEnv): Metadata['robots'] =>
  siteEnv === SiteEnv.Preview ? { index: false, follow: false } : undefined;
