import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  // Serial execution: the local dev store is a single JSON file with no
  // cross-process locking, so parallel workers would race on writes.
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev --port 3000",
    url: "http://localhost:3000/api/health/live",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
