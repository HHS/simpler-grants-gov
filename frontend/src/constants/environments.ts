/**
 * Define environment variables that you need exposed in the client-side bundle.
 * These should not include sensitive secrets!
 */
const PUBLIC_ENV_VARS_BY_ENV = {
  development: {
    GOOGLE_ANALYTICS_ID: "GTM-MV57HMHS",
    GTM_AUTH: "Xf-LmsD6dhZRJXZz21rZVA",
    GTM_PREVIEW: "env-8",
  },
  test: {
    GOOGLE_ANALYTICS_ID: "GTM-MV57HMHS",
    GTM_AUTH: "73_zp32T8ExOVz-f_X56dQ",
    GTM_PREVIEW: "env-9",
  },
  production: {
    GOOGLE_ANALYTICS_ID: "GTM-MV57HMHS",
    GTM_AUTH: "hqnD044nMRMTQ0C3XBpbfQ",
    GTM_PREVIEW: "env-1",
  },
} as const;

const NEXT_ENVS = ["development", "test", "production"] as const;
export type NextPublicAppEnv = (typeof NEXT_ENVS)[number];

const CURRENT_ENV = process.env.NODE_ENV ?? "development";

export const PUBLIC_ENV = PUBLIC_ENV_VARS_BY_ENV[CURRENT_ENV];
