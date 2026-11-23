// 10 minutes
export const clientTokenRefreshInterval = 10 * 60 * 1000;

// 15 minutes
export const clientTokenExpirationInterval = 15 * 60 * 1000;

export const SESSION_DURATION_OVERRIDE_PARAM = "session_duration_seconds";
export const SESSION_DURATION_OVERRIDE_COOKIE = "session_duration_override";
export const SESSION_DURATION_OVERRIDE_ENVIRONMENTS = [
  "local",
  "dev",
  "staging",
];
export const MIN_SESSION_DURATION_OVERRIDE_SECONDS = 30;
export const MAX_SESSION_DURATION_OVERRIDE_SECONDS =
  clientTokenExpirationInterval / 1000;
export const SESSION_DURATION_OVERRIDE_COOKIE_MAX_AGE_SECONDS = 30 * 60;

export const LOGIN_URL = "/api/auth/login";
export const LOGOUT_URL = "/api/auth/logout";

export const LOGIN_REDIRECT_STORAGE_KEY = "login-redirect";
export const LOGIN_REDIRECT_FALLBACK = "/";
export const LOGIN_REDIRECT_BLOCKED_PREFIXES = [
  "/login",
  "/logout",
  "/maintenance",
  "/error",
  "/api",
  "/dev",
];
export const AUTH_GATED_PATH_PREFIXES = [
  "/workspace",
  "/settings",
  "/notifications",
  "/developers/api-dashboard",
];

export const testApplicationId = "892a6aa8-92b1-46c2-a26b-21a6aaab825d";
