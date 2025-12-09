import fs from "fs";
import path from "path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables from .env.local if it exists
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, quiet: true });
}

// Determine environment: can be overridden via PLAYWRIGHT_TARGET_ENV
const ENV = process.env.PLAYWRIGHT_TARGET_ENV || "local";

// Base URLs for each environment, read from .env.local if present, else fallback to defaults
const BASE_URLS: Record<string, string> = {
  local: process.env.LOCAL_BASE_URL || "http://127.0.0.1:3000",
  staging: process.env.STAGING_BASE_URL || "https://staging.simpler.grants.gov",
};

export const baseUrl = BASE_URLS[ENV] || BASE_URLS.local;

// Environment for web server
const webServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...process.env,
    NEW_RELIC_ENABLED: "false", // disable New Relic for E2E
  }).filter(([, value]) => typeof value === "string"),
);

const testOpportunityIdMap: { [key: string]: string } = {
  staging: "fa5703d3-a358-4969-9c1e-c5cc0ce21f63",
  local: "c3c59562-a54f-4203-b0f6-98f2f0383481",
};

const targetEnv = process.env.PLAYWRIGHT_TARGET_ENV || "local";

// either a statically seeded id or an id that exists in staging pointing to a fully populated opportunity
// note that this staging id may be subject to change
const testOpportunityId = testOpportunityIdMap[targetEnv];

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
    baseURL,
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
   * - Staging: Only Chromium, currently includes login via Login.gov MFA test.
   */
  projects:
    ENV === "local"
      ? [
          {
            name: "local-e2e-chromium",
            testDir: "./e2e",
            grepInvert: /@login/,
            testIgnore: "login/**",
            use: {
              ...devices["Desktop Chrome"],
              baseURL: baseUrl,
              permissions: ["clipboard-read", "clipboard-write"],
            },
          },
          {
            name: "local-e2e-firefox",
            testDir: "./e2e",
            grepInvert: /@login/,
            testIgnore: "login/**",
            use: {
              ...devices["Desktop Firefox"],
              baseURL: baseUrl,
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
              baseURL: baseUrl,
              permissions: ["clipboard-read"],
            },
          },
          {
            name: "local-e2e-mobile-chrome",
            testDir: "./e2e",
            grepInvert: /@login/,
            testIgnore: "login/**",
            use: {
              ...devices["Pixel 7"],
              baseURL: baseUrl,
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
                baseURL: baseUrl,
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
