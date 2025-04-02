import { stringToBoolean } from "src/utils/generalUtils";

const {
  NEXT_PUBLIC_BASE_PATH,
  USE_SEARCH_MOCK_DATA,
  SENDY_API_URL,
  SENDY_API_KEY,
  SENDY_LIST_ID,
  API_URL,
  API_AUTH_TOKEN,
  NEXT_BUILD,
  SESSION_SECRET,
  NEXT_PUBLIC_BASE_URL,
  ENVIRONMENT = "dev",
  FEATURE_SEARCH_OFF,
  FEATURE_OPPORTUNITY_OFF,
  FEATURE_AUTH_ON,
  FEATURE_SAVED_OPPORTUNITIES_ON,
  FEATURE_SAVED_SEARCHES_ON,
  AUTH_LOGIN_URL,
  API_JWT_PUBLIC_KEY,
  NEW_RELIC_ENABLED,
} = process.env;

export const featureFlags = {
  opportunityOff: stringToBoolean(FEATURE_OPPORTUNITY_OFF),
  searchOff: stringToBoolean(FEATURE_SEARCH_OFF),
  authOn: stringToBoolean(FEATURE_AUTH_ON),
  savedOpportunitiesOn: stringToBoolean(FEATURE_SAVED_OPPORTUNITIES_ON),
  savedSearchesOn: stringToBoolean(FEATURE_SAVED_SEARCHES_ON),
};

// home for all interpreted server side environment variables
export const environment: { [key: string]: string } = {
  LEGACY_HOST:
    ENVIRONMENT === "prod" ? "https://grants.gov" : "https://test.grants.gov",
  NEXT_PUBLIC_BASE_PATH: NEXT_PUBLIC_BASE_PATH ?? "",
  USE_SEARCH_MOCK_DATA: USE_SEARCH_MOCK_DATA || "",
  SENDY_API_URL: SENDY_API_URL || "",
  SENDY_API_KEY: SENDY_API_KEY || "",
  SENDY_LIST_ID: SENDY_LIST_ID || "",
  API_URL: API_URL || "",
  AUTH_LOGIN_URL: AUTH_LOGIN_URL || "",
  API_AUTH_TOKEN: API_AUTH_TOKEN || "",
  GOOGLE_TAG_MANAGER_ID: "GTM-MV57HMHS",
  ENVIRONMENT,
  NEXT_BUILD: NEXT_BUILD || "false",
  SESSION_SECRET: SESSION_SECRET || "",
  NEXT_PUBLIC_BASE_URL: NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  API_JWT_PUBLIC_KEY: API_JWT_PUBLIC_KEY || "",
  NEW_RELIC_ENABLED: NEW_RELIC_ENABLED || "false",
};
