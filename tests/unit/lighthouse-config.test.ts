import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

type LighthouseConfig = {
  ci: {
    assert: {
      aggregationMethod?: string;
      assertions: Record<string, [string, { minScore: number }]>;
    };
  };
};

const config = require('../../lighthouserc.cjs') as LighthouseConfig;

describe('lighthouserc.cjs', () => {
  it('порог считается по худшему из прогонов, не по лучшему', () => {
    expect(config.ci.assert.aggregationMethod).toBe('pessimistic');
  });

  it('performance каждого прогона не ниже 90', () => {
    expect(config.ci.assert.assertions['categories:performance']).toEqual(['error', { minScore: 0.9 }]);
  });

  it('accessibility каждого прогона равна 100', () => {
    expect(config.ci.assert.assertions['categories:accessibility']).toEqual(['error', { minScore: 1 }]);
  });
});
