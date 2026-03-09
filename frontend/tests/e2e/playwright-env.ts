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

// Opportunity IDs for each environment
const OPPORTUNITY_IDS: Record<string, string> = {
  local: "924022f2-d89c-4af2-a7e5-f1cbdee4d385",
  staging: "f7a1c2b3-4d5e-6789-8abc-1234567890ab",
};

// Determine environment: can be overridden via PLAYWRIGHT_TARGET_ENV
const targetEnv = process.env.PLAYWRIGHT_TARGET_ENV || "local";

const baseUrl = BASE_URLS[targetEnv] || BASE_URLS.local;

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

// Determine opportunity ID based on environment
const getOpportunityId = (): string => {
  // Allow explicit override
  if (process.env.OPPORTUNITY_ID) {
    return process.env.OPPORTUNITY_ID;
  }

  // Use environment-specific opportunity ID
  return OPPORTUNITY_IDS[targetEnv] || OPPORTUNITY_IDS.local;
};

const playwrightEnv = {
  webServerEnv,
  baseUrl,
  targetEnv,
  testOrgLabel,
  opportunityId: getOpportunityId(),
  isCi: process.env.CI,
  totalShards: process.env.TOTAL_SHARDS,
  currentShard: process.env.CURRENT_SHARD,
  fakeServerToken: process.env.E2E_USER_AUTH_TOKEN,
  clientSessionSecret: process.env.SESSION_SECRET,
  testUserEmail:
    process.env.STAGING_TEST_USER_EMAIL ||
    "",
  testUserPassword: process.env.STAGING_TEST_USER_PASSWORD || "",
  testUserAuthKey:
    process.env.STAGING_TEST_USER_MFA_KEY || "",
};

export default playwrightEnv;
