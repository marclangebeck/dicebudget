import { defineConfig, devices } from "@playwright/test";

/**
 * E2E nur manuell lokal: `npm run test:e2e` (startet Dev-Server kurzzeitig, danach beenden).
 * Kein CI-Watcher auf dem Produktionsserver — siehe AGENT_RULES.md.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3021",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3021",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
