import path from "path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

// oddly, this value is not available to tests via config, need to export it for use in individual tests
export const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 75000,
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 0,
  workers: 10,
  // Use 'blob' for CI to allow merging of reports. See https://playwright.dev/docs/test-reporters
  reporter: process.env.CI ? "blob" : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "on",
    video: "on-first-retry",
  },
  shard: {
    // Total number of shards
    total: parseInt(process.env.TOTAL_SHARDS || "1"),
    // Specifies which shard this job should execute
    current: parseInt(process.env.CURRENT_SHARD || "1"),
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"], // firefox doesn't support clipboard-write or clipboard-read
        permissions: [],
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        permissions: ["clipboard-read"], // webkit doesn't support clipboard-write
      },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 7"],
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
      },
});
