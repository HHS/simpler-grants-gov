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
const getEnv = (name: string): string | undefined => {
  return process.env[name];
};

// Base URLs with defaults
const localBaseUrl = getEnv("LOCAL_BASE_URL") || "http://127.0.0.1:3000";
const stagingBaseUrl =
  getEnv("STAGING_BASE_URL") || "https://staging.simpler.grants.gov";

// Use PLAYWRIGHT_BASE_URL or fallback based on environment
const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ||
  (ENV === "staging" ? stagingBaseUrl : localBaseUrl);

// Environment for web server
const webServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...process.env,
    NEW_RELIC_ENABLED: "false", // disable New Relic for E2E
  }).filter(([, value]) => typeof value === "string"),
);

export default defineConfig({
  timeout: 75000,
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: 10,
  reporter: process.env.CI ? "blob" : "html",
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
    screenshot: "on",
    video: "on-first-retry",
  },
  shard: {
    total: parseInt(process.env.TOTAL_SHARDS || "1"),
    current: parseInt(process.env.CURRENT_SHARD || "1"),
  },
  projects: [
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
        ...devices["Desktop Firefox"],
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
        baseURL: localBaseUrl,
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },

    // Staging login tests
    {
      name: "login-staging-chromium",
      testDir: "./e2e/login",
      grep: /@login/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: stagingBaseUrl,
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
  ],

  // Start local dev server only for local environment
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
