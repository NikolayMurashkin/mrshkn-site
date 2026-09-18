import { defineConfig, devices } from '@playwright/test';
import { PREVIEW_BASE_URL, PREVIEW_PORT, PRODUCTION_BASE_URL, PRODUCTION_PORT } from './tests/e2e/consts';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: PREVIEW_BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `yarn build && yarn start -p ${PREVIEW_PORT}`,
      url: PREVIEW_BASE_URL,
      env: { SITE_ENV: 'preview', NEXT_DIST_DIR: '.next-preview' },
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: 'pipe',
    },
    {
      command: `yarn build && yarn start -p ${PRODUCTION_PORT}`,
      url: PRODUCTION_BASE_URL,
      env: { SITE_ENV: 'production', NEXT_DIST_DIR: '.next-production' },
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: 'pipe',
    },
  ],
});
