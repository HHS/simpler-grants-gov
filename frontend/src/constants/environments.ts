import { stringToBoolean } from "src/utils/generalUtils";

import { env } from "next-runtime-env";

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
  NEXT_PUBLIC_FEATURE_SEARCH_OFF,
  NEXT_PUBLIC_FEATURE_OPPORTUNITY_OFF,
  NEXT_PUBLIC_FEATURE_AUTH_OFF,
  NEXT_BUILD,
  SESSION_SECRET,
} = process.env;

// eslint-disable-next-line
// console.log("!!! from public env", process.env.NEXT_PUBLIC_NEXT_PUBLIC_FEATURE_AUTH_OFF);÷

// by convention all feature flag env var names start with "FEATURE"
// and all app side feature flag names should be in the camel case version of the env var names (minus FEATURE)
// ex "NEXT_PUBLIC_FEATURE_SEARCH_OFF" -> "searchOff"
export const featureFlags = {
  opportunityOff: stringToBoolean(env("NEXT_PUBLIC_FEATURE_OPPORTUNITY_OFF")),
  searchOff: stringToBoolean(env("NEXT_PUBLIC_FEATURE_SEARCH_OFF")),
  authOff: stringToBoolean(env("NEXT_PUBLIC_FEATURE_AUTH_OFF")),
};

// export const featureFlags = {
//   opportunityOff: stringToBoolean(NEXT_PUBLIC_FEATURE_OPPORTUNITY_OFF),
//   searchOff: stringToBoolean(NEXT_PUBLIC_FEATURE_SEARCH_OFF),
//   authOff: stringToBoolean(NEXT_PUBLIC_FEATURE_AUTH_OFF),
// };

console.log("!!! from env", featureFlags);

// home for all interpreted server side environment variables
export const environment: { [key: string]: string } = {
  LEGACY_HOST:
    NODE_ENV === "production"
      ? "https://grants.gov"
      : "https://test.grants.gov",
  NEXT_PUBLIC_BASE_PATH: NEXT_PUBLIC_BASE_PATH ?? "",
  USE_SEARCH_MOCK_DATA: USE_SEARCH_MOCK_DATA || "",
  SENDY_API_URL: SENDY_API_URL || "",
  SENDY_API_KEY: SENDY_API_KEY || "",
  SENDY_LIST_ID: SENDY_LIST_ID || "",
  API_URL: API_URL || "",
  API_AUTH_TOKEN: API_AUTH_TOKEN || "",
  NEXT_PUBLIC_BASE_URL: NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  GOOGLE_TAG_MANAGER_ID: "GTM-MV57HMHS",
  // FEATURE_OPPORTUNITY_OFF: FEATURE_OPPORTUNITY_OFF || "false",
  // FEATURE_SEARCH_OFF: FEATURE_SEARCH_OFF || "false",
  // FEATURE_AUTH_OFF: FEATURE_AUTH_OFF || "false",
  NEXT_BUILD: NEXT_BUILD || "false",
  SESSION_SECRET: SESSION_SECRET || "",
};
