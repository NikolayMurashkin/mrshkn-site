const design = process.env.LIGHTHOUSE_DESIGN ?? 'kinetic';

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'SITE_ENV=production NEXT_DIST_DIR=.next-production yarn start -p 3102',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 120000,
      url: ['http://localhost:3102/ru'],
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
