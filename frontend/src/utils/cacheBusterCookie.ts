/**
 * Cookie-based cache busting utilities
 *
 * Instead of URL parameters, we use a cookie to bust CloudFront cache for authenticated users.
 * This keeps URLs clean while still preventing stale cached content.
 */

const CACHE_BUSTER_COOKIE_NAME = "cache_buster";

/**
 * Generate a unique cache buster value (epoch timestamp + random suffix)
 */
function generateCacheBusterValue(): string {
  const epochMs = Date.now();
  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 10)
    .toLowerCase();
  return `${epochMs}_${randomSuffix}`;
}

/**
 * Set or update the cache buster cookie
 * This is called when:
 * - User logs in
 * - User navigates (to force fresh content)
 */
export function setCacheBusterCookie(): void {
  if (typeof document === "undefined") return; // Server-side check

  const value = generateCacheBusterValue();

  // Set cookie with SameSite and Secure for production
  const isProduction = window.location.protocol === "https:";
  const cookieString = [
    `${CACHE_BUSTER_COOKIE_NAME}=${value}`,
    "Path=/",
    "SameSite=Lax",
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookieString;
}

/**
 * Remove the cache buster cookie
 * This is called when user logs out
 */
export function removeCacheBusterCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${CACHE_BUSTER_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Check if cache buster cookie exists
 */
export function hasCacheBusterCookie(): boolean {
  if (typeof document === "undefined") return false;

  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${CACHE_BUSTER_COOKIE_NAME}=`));
}
