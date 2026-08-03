import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local if it exists
const envPath = path.resolve(__dirname, "..", "..", ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, quiet: true });
}

const SUPPORTED_ENVS = ["local", "staging"] as const;
export type SupportedEnvs = (typeof SUPPORTED_ENVS)[number];

// Organization label shown in the "Start new application" modal dropdown.
// Must match the legal_business_name in seed_orgs_and_users.py.
const TEST_ORG_LABELS: Record<string, string> = {
  local: "Sally's Soup Emporium",
  staging: "Automatic staging Organization for UEI AUTOHQDCCHBY",
};

const targetEnv = process.env.PLAYWRIGHT_TARGET_ENV || "local";
const testOrgLabel = TEST_ORG_LABELS[targetEnv];

const isLocal = targetEnv === "local";
const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL || (isLocal ? "http://127.0.0.1:3000" : "");
const apiUrl =
  process.env.PLAYWRIGHT_API_URL || (isLocal ? "http://127.0.0.1:8080" : "");

// this does what it can to prevent the app from starting with mismatched target env and url variable assignments
if (!baseUrl || !apiUrl) {
  throw new Error(
    `PLAYWRIGHT_BASE_URL and PLAYWRIGHT_API_URL must be set when PLAYWRIGHT_TARGET_ENV=${targetEnv}`,
  );
}

if (SUPPORTED_ENVS.indexOf(targetEnv as SupportedEnvs) === -1) {
  throw new Error(
    `Unsupported PLAYWRIGHT_TARGET_ENV: ${targetEnv}. Allowed values: ${SUPPORTED_ENVS.join(", ")}`,
  );
}

// Environment for web server
const webServerEnv: Record<string, string> = Object.fromEntries(
  Object.entries({
    ...process.env,
    NEW_RELIC_ENABLED: "false", // disable New Relic for E2E
  }).filter(([, value]) => typeof value === "string"),
);

const playwrightEnv = {
  webServerEnv,
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
  apiUrl: process.env.PLAYWRIGHT_API_URL || "http://127.0.0.1:8080",
  targetEnv,
  testOrgLabel,
  isCi: process.env.CI,
  totalShards: process.env.TOTAL_SHARDS,
  currentShard: process.env.CURRENT_SHARD,
  clientSessionSecret:
    process.env.SESSION_SECRET_OVERRIDE || process.env.SESSION_SECRET,
  testUserEmail: process.env.STAGING_TEST_USER_EMAIL || "",
  testUserPassword: process.env.STAGING_TEST_USER_PASSWORD || "",
  testUserAuthKey: process.env.STAGING_TEST_USER_MFA_KEY || "",
  testUserManagerApiKey: process.env.TEST_USER_MANAGER_API_KEY || "",
};

export default playwrightEnv;
