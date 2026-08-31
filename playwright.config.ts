import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter @gimme-idea/api start',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @gimme-idea/web start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'mobile-360',
      use: { ...devices['Mobile Chrome'], viewport: { width: 360, height: 800 } },
    },
    {
      name: 'tablet-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
});
