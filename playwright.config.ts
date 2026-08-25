import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end suite for the Paint showcase.
 *
 * The unit suite asserts what each atom promises in isolation, under Karma,
 * with synthetic events. This suite asserts the same promises in a real
 * browser, on the real pages, with real keys: a `Home` press on a range input
 * is the browser's business as much as Paint's, and only a browser can say
 * whether the two agree.
 *
 * `CHROME_BIN` (or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`) points the suite at an
 * existing Chromium — the same variable Karma honours — so CI needs one
 * browser, not two.
 */
const executablePath =
  process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] || process.env['CHROME_BIN'] || undefined;

const port = Number(process.env['E2E_PORT'] ?? 4273);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    // The showcase follows the OS theme by default; tests pin it.
    colorScheme: 'light',
    launchOptions: {
      executablePath,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx ng serve --port ${port} --no-open --no-live-reload`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});