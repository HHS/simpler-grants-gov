import path from "path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Increased timeout on standard 2-core runner where resources are constrained
  timeout: process.env.CI ? 120000 : 75000,
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 0,
  /* Limit workers in CI to reduce concurrent load on API server */
  /* Using 2 workers for faster execution - prevents long-running degradation on 2-core runner */
  workers: process.env.CI ? parseInt(process.env.PLAYWRIGHT_WORKERS || "2") : 10,
  // Use 'blob' for CI to allow merging of reports. See https://playwright.dev/docs/test-reporters
  reporter: process.env.CI ? "blob" : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://127.0.0.1:3000",

    /* Increase navigation timeout to handle slow SSR responses on resource-constrained CI runner */
    navigationTimeout: process.env.CI ? 90000 : 60000, // 90s in CI, 60s locally

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "on",
    video: "on-first-retry",
  },
  // No shard config needed - sharding handled by GitHub Actions matrix (one browser per job)
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
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
