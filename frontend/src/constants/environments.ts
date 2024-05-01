/**
 * Define environment variables that you need exposed in the client-side bundle.
 * These should not include sensitive secrets!
 */
const PUBLIC_ENV_VARS_BY_ENV = {
  development: {
    GOOGLE_TAG_MANAGER_ID: "GTM-MV57HMHS",
    GOOGLE_ANALYTICS_ID: "G-6MDCC5EZW2",
  },
  test: {
    GOOGLE_TAG_MANAGER_ID: "GTM-MV57HMHS",
    GOOGLE_ANALYTICS_ID: "G-6MDCC5EZW2",
  },
  production: {
    GOOGLE_TAG_MANAGER_ID: "GTM-MV57HMHS",
    GOOGLE_ANALYTICS_ID: "G-6MDCC5EZW2",
  },
} as const;

const NEXT_ENVS = ["development", "test", "production"] as const;
export type NextPublicAppEnv = (typeof NEXT_ENVS)[number];

const CURRENT_ENV = process.env.NODE_ENV ?? "development";

export const PUBLIC_ENV = PUBLIC_ENV_VARS_BY_ENV[CURRENT_ENV];
