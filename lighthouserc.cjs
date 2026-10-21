const design = process.env.LIGHTHOUSE_DESIGN ?? 'kinetic';

const SERVICE_SLUGS = ['landing', 'business', 'mini-app', 'store', 'mvp', 'support', 'industry', '3d'];

const BASE_URL = 'http://localhost:3102';

const urls = [
  `${BASE_URL}/ru`,
  `${BASE_URL}/ru/work/lighthouse-demo`,
  `${BASE_URL}/ru/brief`,
  ...SERVICE_SLUGS.map((slug) => `${BASE_URL}/ru/${slug}`),
];

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'SITE_ENV=production NEXT_DIST_DIR=.next-production yarn start -p 3102',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 120000,
      url: urls,
      numberOfRuns: 3,
      settings: {
        extraHeaders: { Cookie: `design=${design}` },
      },
    },
    assert: {
      aggregationMethod: 'pessimistic',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: `.lighthouseci/${design}`,
    },
  },
};
