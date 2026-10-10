import type { MetadataRoute } from 'next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '@/app/robots';
import { SITE_URL } from '@/lib/consts';

type Rule = Exclude<MetadataRoute.Robots['rules'], unknown[]>;

const list = (value: string | string[] | undefined) => (value === undefined ? [] : [value].flat());

/** Правило для всех роботов: `rules` бывает и одним объектом, и массивом. */
const ruleForAll = (result: MetadataRoute.Robots): Rule | undefined =>
  [result.rules].flat().find((rule) => list(rule.userAgent).includes('*'));

const robotsWith = (siteEnv: string | undefined) => {
  vi.stubEnv('SITE_ENV', siteEnv);

  return robots();
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('robots()', () => {
  it('R1: production — индексировать сайт, кроме админки и API, карта сайта указана', () => {
    const result = robotsWith('production');
    const rule = ruleForAll(result);

    expect(rule, 'правило для userAgent *').toBeDefined();
    expect(list(rule?.allow)).toContain('/');
    expect(list(rule?.disallow)).toContain('/admin');
    expect(list(rule?.disallow)).toContain('/api');
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it('R2: preview (stage) — весь сайт закрыт', () => {
    const rule = ruleForAll(robotsWith('preview'));

    expect(rule, 'правило для userAgent *').toBeDefined();
    expect(list(rule?.disallow)).toContain('/');
    expect(list(rule?.allow)).not.toContain('/');
  });

  it('R3: SITE_ENV не задан — как preview, весь сайт закрыт', () => {
    const rule = ruleForAll(robotsWith(undefined));

    expect(rule, 'правило для userAgent *').toBeDefined();
    expect(list(rule?.disallow)).toContain('/');
  });
});
