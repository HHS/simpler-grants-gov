// 10 minutes
export const clientTokenRefreshInterval = 10 * 60 * 1000;

// 15 minutes
export const clientTokenExpirationInterval = 15 * 60 * 1000;

export const LOGIN_URL = "/api/auth/login";
export const LOGOUT_URL = "/api/auth/logout";

export const LOGIN_REDIRECT_STORAGE_KEY = "login-redirect";
export const LOGIN_REDIRECT_FALLBACK = "/";
export const LOGIN_REDIRECT_BLOCKED_PREFIXES = [
  "/login",
  "/logout",
  "/maintenance",
  "/unauthenticated",
  "/error",
  "/api",
  "/dev",
];

export const testApplicationId = "892a6aa8-92b1-46c2-a26b-21a6aaab825d";
