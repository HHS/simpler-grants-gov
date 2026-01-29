import { defineConfig, devices } from "@playwright/test";

import playwrightEnv from "./e2e/playwright-env";

const { baseUrl, targetEnv, webServerEnv, isCi, totalShards, currentShard } =
  playwrightEnv;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: targetEnv === "local" ? 75000 : 120000,
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!isCi,
  /* Retry on CI only, but reduce retries for staging */
  retries: isCi && targetEnv === "staging" ? 1 : isCi ? 3 : 0,
  // Reduce workers for staging to prevent resource exhaustion
  workers: targetEnv === "staging" ? 2 : 10,
  // Use 'blob' for CI to allow merging of reports. See https://playwright.dev/docs/test-reporters
  reporter: isCi ? "blob" : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: baseUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "on",
    video: "on-first-retry",
  },
  // Enable test sharding for parallelization in CI.
  shard: {
    // Total number of shards is specified via env variable or defaults to 1
    total: parseInt(totalShards || "1"),
    // Specifies which shard this job should execute
    current: parseInt(currentShard || "1"),
  },
  /* Configure projects for major browsers */
  projects:
    targetEnv === "staging"
      ? [
          {
            name: "Chrome",
            use: {
              ...devices["Desktop Chrome"],
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
        ]
      : [
          {
            name: "Chrome",
            use: {
              ...devices["Desktop Chrome"],
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
          {
            name: "Firefox",
            use: {
              ...devices["Desktop Firefox"],
              permissions: [],
            },
          },
          {
            name: "Webkit",
            use: {
              ...devices["Desktop Safari"],
              permissions: ["clipboard-read"],
            },
          },
          {
            name: "Mobile chrome",
            use: {
              ...devices["Pixel 7"],
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
        ],

  //  Only start the local dev server when running in the local environment.
  webServer:
    targetEnv === "local"
      ? {
          command: "npm run start",
          url: baseUrl,
          reuseExistingServer: !isCi,
          env: webServerEnv,
        }
      : undefined,
});
