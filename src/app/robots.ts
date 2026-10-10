import type { MetadataRoute } from 'next';
import { SiteEnv, SITE_URL } from '@/lib/consts';
import { getSiteEnv } from '@/lib/site-env';

/** Боевой сайт открыт поисковикам, кроме админки и API; стенд (`preview`) закрыт целиком. */
const robots = (): MetadataRoute.Robots =>
  getSiteEnv() === SiteEnv.Production
    ? {
        rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
        sitemap: `${SITE_URL}/sitemap.xml`,
      }
    : { rules: { userAgent: '*', disallow: '/' } };

export default robots;
