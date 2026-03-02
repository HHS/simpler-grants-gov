import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local if it exists
const envPath = path.resolve(__dirname, "..", "..", ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, quiet: true });
}

// Base URLs for each environment, read from .env.local if present, else fallback to defaults
const BASE_URLS: Record<string, string> = {
  local: process.env.LOCAL_BASE_URL || "http://127.0.0.1:3000",
  staging: process.env.STAGING_BASE_URL || "https://staging.simpler.grants.gov",
};

// Determine environment: can be overridden via PLAYWRIGHT_TARGET_ENV
const targetEnv = process.env.PLAYWRIGHT_TARGET_ENV || "local";

if (!Object.prototype.hasOwnProperty.call(BASE_URLS, targetEnv)) {
  throw new Error(
    `Unsupported PLAYWRIGHT_TARGET_ENV: ${targetEnv}. Allowed values: ${Object.keys(BASE_URLS).join(", ")}`,
  );
}

const baseUrl = BASE_URLS[targetEnv];

// Test organization labels for each environment
const TEST_ORG_LABELS: Record<string, string> = {
  local: "Sally's Soup Emporium",
  staging: "Automatic staging Organization for UEI AUTOHQDCCHBY",
};

const testOrgLabel = TEST_ORG_LABELS[targetEnv];

// Environment for web server
const webServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...process.env,
    NEW_RELIC_ENABLED: "false", // disable New Relic for E2E
  }).filter(([, value]) => typeof value === "string"),
);

const playwrightEnv = {
  webServerEnv,
  baseUrl,
  targetEnv,
  testOrgLabel,
  isCi: process.env.CI,
  totalShards: process.env.TOTAL_SHARDS,
  currentShard: process.env.CURRENT_SHARD,
  fakeServerToken: process.env.E2E_USER_AUTH_TOKEN,
  clientSessionSecret: process.env.SESSION_SECRET,
  testUserEmail: process.env.STAGING_TEST_USER_EMAIL || "",
  testUserPassword: process.env.STAGING_TEST_USER_PASSWORD || "",
  testUserAuthKey: process.env.STAGING_TEST_USER_MFA_KEY || "",
};

export default playwrightEnv;
