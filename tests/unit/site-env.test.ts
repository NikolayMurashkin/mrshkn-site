import { describe, expect, it } from 'vitest';
import { SiteEnv } from '@/lib/consts';
import { resolveSiteEnv, robotsMetadata } from '@/lib/site-env';

describe('индексация по окружению сборки', () => {
  it('preview запрещает индексацию', () => {
    expect(robotsMetadata(SiteEnv.Preview)).toEqual({ index: false, follow: false });
  });

  it('production не ограничивает индексацию', () => {
    expect(robotsMetadata(SiteEnv.Production)).toBeUndefined();
  });

  it.each([undefined, '', 'staging', 'PRODUCTION'])('SITE_ENV=%o трактуется как preview', (value) => {
    expect(resolveSiteEnv(value)).toBe(SiteEnv.Preview);
  });

  it('SITE_ENV=production трактуется как production', () => {
    expect(resolveSiteEnv('production')).toBe(SiteEnv.Production);
  });
});
