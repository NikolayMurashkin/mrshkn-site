import { defineConfig, devices } from '@playwright/test';
import {
  PREVIEW_BASE_URL,
  PREVIEW_PORT,
  PRODUCTION_BASE_URL,
  PRODUCTION_PORT,
  SINK_BASE_URL,
  SINK_SMTP_PORT,
} from './tests/e2e/consts';

/** Заявка уходит в три настоящих канала, поэтому на время тестов все три смотрят в приемник. */
const LEAD_ENV = {
  TELEGRAM_API_URL: `${SINK_BASE_URL}/telegram`,
  TELEGRAM_BOT_TOKEN: 'sink-token',
  TELEGRAM_CHAT_IDS: '100100,200200',
  BITRIX_WEBHOOK_URL: `${SINK_BASE_URL}/bitrix`,
  SMTP_URL: `smtp://127.0.0.1:${SINK_SMTP_PORT}`,
  LEAD_MAIL_TO: 'hello@mrshkn.com',
  LEAD_MAIL_FROM: 'site@mrshkn.com',
};

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
      command: 'node tests/e2e/lead-sink.ts',
      url: `${SINK_BASE_URL}/calls`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
    },
    {
      command: `yarn build && yarn start -p ${PREVIEW_PORT}`,
      url: PREVIEW_BASE_URL,
      env: { SITE_ENV: 'preview', NEXT_DIST_DIR: '.next-preview', ...LEAD_ENV },
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
