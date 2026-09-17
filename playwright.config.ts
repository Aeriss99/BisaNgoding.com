import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  globalTimeout: 180_000,
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'GITHUB_PAGES= npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
