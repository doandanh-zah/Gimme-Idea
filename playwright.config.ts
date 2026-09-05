import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command:
        'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres ENABLE_DEV_MOCK_AUTH=true DEV_AUTH_SECRET=e2e-development-auth-secret-change-me DEV_MOCK_RATE_LIMIT_MAX=100 RATE_LIMIT_MAX=100000 CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000 LOG_LEVEL=silent pnpm --filter @gimme-idea/api dev',
      port: 3001,
      reuseExistingServer: false,
    },
    {
      command:
        'NEXT_PUBLIC_ENABLE_DEV_AUTH=true NEXT_PUBLIC_API_URL=http://127.0.0.1:3001 API_INTERNAL_URL=http://127.0.0.1:3001 pnpm --filter @gimme-idea/web dev',
      port: 3000,
      reuseExistingServer: false,
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
