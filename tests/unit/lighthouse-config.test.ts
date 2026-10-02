import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { SLUG_PATTERN } from '@/cms/consts';

const require = createRequire(import.meta.url);

type LighthouseConfig = {
  ci: {
    collect: { url: string[] };
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

type WorkflowStep = { name?: string; run?: string };

type Workflow = { jobs: Record<string, { services?: Record<string, unknown>; steps: WorkflowStep[] }> };

const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as Workflow;

describe('джоба Lighthouse с кейсом', () => {
  it('меряются главная и страница одного засеянного кейса; джоба поднимает Postgres, мигрирует и засевает до замера', () => {
    const [home, ...rest] = config.ci.collect.url;

    expect(home).toBe('http://localhost:3102/ru');
    expect(rest).toHaveLength(1);

    const prefix = 'http://localhost:3102/ru/work/';

    expect(rest[0].startsWith(prefix)).toBe(true);
    expect(rest[0].slice(prefix.length)).toMatch(SLUG_PATTERN);

    const job = workflow.jobs.lighthouse;
    const runs = job.steps.map((step) => step.run ?? '');
    const indexOf = (command: string) => runs.findIndex((run) => run.includes(command));
    const measure = indexOf('test:lighthouse');

    expect(Object.keys(job.services ?? {})).toContain('postgres');
    expect(measure).toBeGreaterThanOrEqual(0);
    expect(indexOf('payload migrate')).toBeGreaterThanOrEqual(0);
    expect(indexOf('payload migrate')).toBeLessThan(measure);
    expect(indexOf('seed:lighthouse')).toBeGreaterThanOrEqual(0);
    expect(indexOf('seed:lighthouse')).toBeLessThan(measure);
  });
});
