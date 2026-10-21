import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { SLUG_PATTERN } from '@/cms/consts';
import { PRICING_PLANS } from '@/content/pricing';
import { DESIGN_NAMES } from '@/designs/consts';

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

const CONFIG_PATH = '../../lighthouserc.cjs';

const loadConfig = (design?: string): LighthouseConfig => {
  const previous = process.env.LIGHTHOUSE_DESIGN;

  if (design === undefined) {
    delete process.env.LIGHTHOUSE_DESIGN;
  } else {
    process.env.LIGHTHOUSE_DESIGN = design;
  }

  delete require.cache[require.resolve(CONFIG_PATH)];

  try {
    return require(CONFIG_PATH) as LighthouseConfig;
  } finally {
    if (previous === undefined) {
      delete process.env.LIGHTHOUSE_DESIGN;
    } else {
      process.env.LIGHTHOUSE_DESIGN = previous;
    }

    delete require.cache[require.resolve(CONFIG_PATH)];
  }
};

const config = loadConfig('kinetic');

describe.each([...DESIGN_NAMES])('lighthouserc.cjs, %s', (design) => {
  const designConfig = loadConfig(design);

  it('порог считается по худшему из прогонов, не по лучшему', () => {
    expect(designConfig.ci.assert.aggregationMethod).toBe('pessimistic');
  });

  it('performance каждого прогона не ниже 90', () => {
    expect(designConfig.ci.assert.assertions['categories:performance']).toEqual(['error', { minScore: 0.9 }]);
  });

  it('accessibility каждого прогона равна 100', () => {
    expect(designConfig.ci.assert.assertions['categories:accessibility']).toEqual(['error', { minScore: 1 }]);
  });
});

describe('адреса Lighthouse по направлениям', () => {
  it.each([...DESIGN_NAMES])('%s меряет главную, один кейс, квиз и страницы всех услуг', (design) => {
    const urls = loadConfig(design).ci.collect.url;
    const caseUrls = urls.filter((url) => url.startsWith('http://localhost:3102/ru/work/'));
    const briefUrl = 'http://localhost:3102/ru/brief';

    expect(urls.filter((url) => url === briefUrl)).toEqual([briefUrl]);
    expect(urls).toHaveLength(3 + PRICING_PLANS.length);
    expect(urls[0]).toBe('http://localhost:3102/ru');
    expect(caseUrls).toHaveLength(1);
    expect(caseUrls[0].slice('http://localhost:3102/ru/work/'.length)).toMatch(SLUG_PATTERN);
    expect(urls.filter((url) => !caseUrls.includes(url) && url !== urls[0] && url !== briefUrl).sort()).toEqual(
      PRICING_PLANS.map((plan) => `http://localhost:3102/ru/${plan.slug}`).sort(),
    );
  });
});

type WorkflowStep = { name?: string; run?: string };

type Workflow = { jobs: Record<string, { services?: Record<string, unknown>; steps: WorkflowStep[] }> };

const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as Workflow;

describe('джоба Lighthouse с кейсом', () => {
  it('меряются главная и страница одного засеянного кейса; джоба поднимает Postgres, мигрирует и засевает до замера', () => {
    const [home, ...rest] = config.ci.collect.url;

    expect(home).toBe('http://localhost:3102/ru');

    const prefix = 'http://localhost:3102/ru/work/';
    const caseUrls = rest.filter((url) => url.startsWith(prefix));

    expect(caseUrls).toHaveLength(1);
    expect(caseUrls[0].slice(prefix.length)).toMatch(SLUG_PATTERN);

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
