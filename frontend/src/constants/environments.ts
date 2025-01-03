const {
  NEXT_PUBLIC_BASE_PATH,
  USE_SEARCH_MOCK_DATA = "",
  SENDY_API_URL,
  SENDY_API_KEY,
  SENDY_LIST_ID,
  API_URL,
  API_AUTH_TOKEN = "",
  NEXT_PUBLIC_BASE_URL,
  FEATURE_SEARCH_OFF = "false",
  FEATURE_OPPORTUNITY_OFF = "false",
  NEXT_BUILD = "false",
  ENVIRONMENT = "dev",
  SESSION_SECRET = "",
  AUTH_LOGIN_URL,
} = process.env;

// home for all interpreted server side environment variables
export const environment: { [key: string]: string } = {
  LEGACY_HOST:
    ENVIRONMENT === "prod" ? "https://grants.gov" : "https://test.grants.gov",
  NEXT_PUBLIC_BASE_PATH: NEXT_PUBLIC_BASE_PATH ?? "",
  USE_SEARCH_MOCK_DATA,
  SENDY_API_URL: SENDY_API_URL || "",
  SENDY_API_KEY: SENDY_API_KEY || "",
  SENDY_LIST_ID: SENDY_LIST_ID || "",
  API_URL: API_URL || "",
  API_AUTH_TOKEN,
  AUTH_LOGIN_URL: AUTH_LOGIN_URL || "",
  NEXT_PUBLIC_BASE_URL: NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  GOOGLE_TAG_MANAGER_ID: "GTM-MV57HMHS",
  FEATURE_OPPORTUNITY_OFF,
  FEATURE_SEARCH_OFF,
  NEXT_BUILD,
  ENVIRONMENT,
  SESSION_SECRET,
};
