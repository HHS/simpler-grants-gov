/**
 * Define environment variables that you need exposed in the client-side bundle.
 * These should not include sensitive secrets!
 */
const PUBLIC_ENV_VARS_BY_ENV = {
  development: {
    GOOGLE_ANALYTICS_ID: "G-GWJZD3DL8W",
  },
  test: {
    GOOGLE_ANALYTICS_ID: "G-6MDCC5EZW2",
  },
  production: {
    GOOGLE_ANALYTICS_ID: "G-6MDCC5EZW2",
  },
} as const;

const NEXT_ENVS = ["development", "test", "production"] as const;
export type NextPublicAppEnv = (typeof NEXT_ENVS)[number];

const {
  NODE_ENV,
  NEXT_PUBLIC_BASE_PATH,
  USE_SEARCH_MOCK_DATA,
  SENDY_API_URL,
  SENDY_API_KEY,
  SENDY_LIST_ID,
  API_URL,
  API_AUTH_TOKEN,
  NEXT_PUBLIC_BASE_URL,
} = process.env;

const CURRENT_ENV = NODE_ENV ?? "development";

export const PUBLIC_ENV = PUBLIC_ENV_VARS_BY_ENV[CURRENT_ENV];

// home for all interpreted server side environment variables
export const environment = {
  NEXT_PUBLIC_BASE_PATH: NEXT_PUBLIC_BASE_PATH ?? "",
  USE_SEARCH_MOCK_DATA,
  SENDY_API_URL: SENDY_API_URL || "",
  SENDY_API_KEY: SENDY_API_KEY || "",
  SENDY_LIST_ID: SENDY_LIST_ID || "",
  API_URL: API_URL || "",
  API_AUTH_TOKEN,
  NEXT_PUBLIC_BASE_URL: NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
};
