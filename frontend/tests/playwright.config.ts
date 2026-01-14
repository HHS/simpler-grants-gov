import fs from "fs";
import path from "path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables from .env.local if it exists
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Determine environment: can be overridden via PLAYWRIGHT_TARGET_ENV
const ENV = process.env.PLAYWRIGHT_TARGET_ENV || "local";

// Helper to get environment variables
// Determine which environment to use for tests (local or staging).
// Can be overridden via PLAYWRIGHT_TARGET_ENV environment variable.
const getEnv = (name: string): string | undefined => {
  return process.env[name];
};

// Base URLs with defaults
// Set base URLs for local and staging environments.
// Fallback to sensible defaults if not provided in environment variables.
const localBaseUrl = getEnv("LOCAL_BASE_URL") || "http://127.0.0.1:3000";
const stagingBaseUrl =
  getEnv("STAGING_BASE_URL") || "https://staging.simpler.grants.gov";

// Use PLAYWRIGHT_BASE_URL or fallback based on environment
const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ||
  (ENV === "staging" ? stagingBaseUrl : localBaseUrl);

// Environment for web server
// Prepare environment variables for the dev server, disabling New Relic for E2E tests.
const webServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...process.env,
    NEW_RELIC_ENABLED: "false", // disable New Relic for E2E
  }).filter(([, value]) => typeof value === "string"),
);
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
    baseURL: baseUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "on",
    video: "on-first-retry",
  },
  // Enable test sharding for parallelization in CI.
  shard: {
    // Total number of shards is specified via env variable or defaults to 1
    total: parseInt(process.env.TOTAL_SHARDS || "1"),
    // Specifies which shard this job should execute
    current: parseInt(process.env.CURRENT_SHARD || "1"),
  },
  /* Configure projects for major browsers */
  /*
   * Define test projects for different browsers and devices.
   * - Local: Multiple browsers, mobile emulation, excludes login tests.
   * - Staging: Only Chromium, currently includes login via Logib.gov MFA test.
   */
  projects:
    ENV === "local"
      ? [
          // Local Desktop Chrome (exclude login)
          {
            name: "local-e2e-chromium",
            testDir: "./e2e",
            grepInvert: /@login/,
            testIgnore: "login/**",
            use: {
              ...devices["Desktop Chrome"],
              baseURL: localBaseUrl,
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
          {
            name: "local-e2e-firefox",
            testDir: "./e2e",
            grepInvert: /@login/,
            testIgnore: "login/**",
            use: {
              ...devices["Desktop Firefox"], // firefox doesn't support clipboard-write or clipboard-read
              baseURL: localBaseUrl,
              permissions: [],
            },
          },
          {
            name: "local-e2e-webkit",
            testDir: "./e2e",
            grepInvert: /@login/,
            testIgnore: "login/**",
            use: {
              ...devices["Desktop Safari"],
              baseURL: localBaseUrl,
              permissions: ["clipboard-read"], // webkit doesn't support clipboard-write
            },
          },
          /* Test against mobile viewports. */
          {
            name: "local-e2e-mobile-chrome",
            testDir: "./e2e",
            grepInvert: /@login/,
            testIgnore: "login/**",
            use: {
              ...devices["Pixel 7"],
              baseURL: localBaseUrl,
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
        ]
      : ENV === "staging"
        ? [
            {
              name: "staging-e2e-chromium",
              testDir: "./e2e",
              use: {
                ...devices["Desktop Chrome"],
                baseURL: stagingBaseUrl,
                permissions: ["clipboard-read", "clipboard-write"],
              },
            },
          ]
        : [],

  //  Only start the local dev server when running in the local environment.
  webServer:
    ENV === "local"
      ? {
          command: "npm run start",
          url: baseUrl,
          reuseExistingServer: !process.env.CI,
          env: webServerEnv,
        }
      : undefined,
});
