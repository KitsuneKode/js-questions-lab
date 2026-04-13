import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?.trim();
const isCI = process.env.CI === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    ...(executablePath
      ? {
          launchOptions: {
            executablePath,
          },
        }
      : {}),
  },
  webServer: {
    command: isCI
      ? `bun run build && bun run start -- --hostname localhost -p ${port}`
      : `bun run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: isCI ? 180_000 : 120_000,
  },
});
