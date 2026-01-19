import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    // URL base do seu frontend
    baseURL: 'https://ia.phant.com.br',

    // Trace para debug
    trace: 'on-first-retry',

    // Screenshots em caso de falha
    screenshot: 'only-on-failure',

    // Video para ver a navegação
    video: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Modo headed para ver em tempo real!
        headless: false,
      },
    },
  ],
});
