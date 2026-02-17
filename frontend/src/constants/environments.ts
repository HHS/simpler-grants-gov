const {
  NEXT_PUBLIC_BASE_PATH,
  USE_SEARCH_MOCK_DATA,
  SENDY_API_URL,
  SENDY_API_KEY,
  SENDY_LIST_ID,
  API_URL,
  API_AUTH_TOKEN,
  API_GW_AUTH,
  NEXT_BUILD,
  SESSION_SECRET,
  NEXT_PUBLIC_BASE_URL,
  ENVIRONMENT = "dev",
  FEATURE_APPLY_FORM_PROTOTYPE_OFF,
  FEATURE_AWARD_RECOMMENDATION_OFF,
  FEATURE_MANAGE_USERS_OFF,
  FEATURE_OPPORTUNITIES_LIST_OFF,
  AUTH_LOGIN_URL,
  AUTH_EXPIRATION_TIME,
  API_JWT_PUBLIC_KEY,
  NEW_RELIC_ENABLED,
  NEXT_RUNTIME,
  CI,
} = process.env;

export const envFeatureFlags = {
  applyFormPrototypeOff: FEATURE_APPLY_FORM_PROTOTYPE_OFF,
  opportunitiesListOff: FEATURE_OPPORTUNITIES_LIST_OFF,
  manageUsersOff: FEATURE_MANAGE_USERS_OFF,
  awardRecommendationOff: FEATURE_AWARD_RECOMMENDATION_OFF,
};

const legacyHost = (): string => {
  switch (ENVIRONMENT) {
    case "prod":
      return "https://www.grants.gov";
    case "training":
      return "https://training.grants.gov";
    case "staging":
      return "https://test.grants.gov";
    case "test":
      return "https://test.grants.gov";
    default:
      return "https://test.grants.gov";
  }
};

// home for all interpreted server side environment variables
export const environment: { [key: string]: string } = {
  LEGACY_HOST: legacyHost(),
  NEXT_PUBLIC_BASE_PATH: NEXT_PUBLIC_BASE_PATH ?? "",
  USE_SEARCH_MOCK_DATA: USE_SEARCH_MOCK_DATA || "",
  SENDY_API_URL: SENDY_API_URL || "",
  SENDY_API_KEY: SENDY_API_KEY || "",
  SENDY_LIST_ID: SENDY_LIST_ID || "",
  API_URL: API_URL || "",
  AUTH_LOGIN_URL: AUTH_LOGIN_URL || "",
  API_AUTH_TOKEN: API_AUTH_TOKEN || "",
  AUTH_EXPIRATION_TIME: AUTH_EXPIRATION_TIME || "0",
  API_GW_AUTH: API_GW_AUTH || "",
  GOOGLE_TAG_MANAGER_ID: "GTM-MV57HMHS",
  ENVIRONMENT,
  NEXT_BUILD: NEXT_BUILD || "false",
  SESSION_SECRET: SESSION_SECRET || "",
  NEXT_PUBLIC_BASE_URL: NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  API_JWT_PUBLIC_KEY: API_JWT_PUBLIC_KEY || "",
  NEW_RELIC_ENABLED: NEW_RELIC_ENABLED || "false",
  NEXT_RUNTIME: NEXT_RUNTIME || "",
  IS_CI: CI || "false",
  LOCAL_DEV:
    ENVIRONMENT === "local" && API_URL?.includes("localhost") ? "true" : "",
};
