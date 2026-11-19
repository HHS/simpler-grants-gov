// 10 minutes
export const clientTokenRefreshInterval = 10 * 60 * 1000;

// 15 minutes
export const clientTokenExpirationInterval = 15 * 60 * 1000;

export const LOGIN_URL = "/api/auth/login";
export const LOGOUT_URL = "/api/auth/logout";

export const LOGIN_REDIRECT_STORAGE_KEY = "login-redirect";
export const LOGIN_REDIRECT_FALLBACK = "/";
// Server-side fallback for the post-sign-in destination, set by /api/auth/login
// from the Referer when the client-side sessionStorage save may not have run
// (e.g. "Sign in" clicked before hydration). sessionStorage always wins over it.
export const LOGIN_REDIRECT_FALLBACK_COOKIE = "login-redirect-fallback";
// 15 minutes, in seconds
export const LOGIN_REDIRECT_FALLBACK_COOKIE_MAX_AGE = 15 * 60;
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
