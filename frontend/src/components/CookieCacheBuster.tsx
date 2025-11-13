"use client";

import { useUser } from "src/services/auth/useUser";
import {
  removeCacheBusterCookie,
  setCacheBusterCookie,
} from "src/utils/cacheBusterCookie";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Cookie-based cache busting for authenticated users
 *
 * This component:
 * 1. Sets a cache_buster cookie when user is authenticated
 * 2. Updates the cookie on every navigation (forces CloudFront cache miss)
 * 3. Removes the cookie when user logs out
 *
 * Benefits over URL-based cache busting:
 * - Clean URLs (no ?_cb= parameters)
 * - Same cache-busting effectiveness
 * - Better UX (URLs are shareable)
 */
export function CookieCacheBuster() {
  const { user } = useUser();
  const pathname = usePathname();
  const wasAuthenticatedRef = useRef<boolean | null>(null);

  // Update cache buster cookie on navigation for authenticated users
  useEffect(() => {
    const isAuthenticated = !!(user && user.token);

    // Update cookie on every navigation if authenticated
    if (isAuthenticated) {
      setCacheBusterCookie();
    }

    // Update ref for next render
    wasAuthenticatedRef.current = isAuthenticated;
  }, [pathname, user]);

  // Handle login/logout - manage cache buster cookie
  useEffect(() => {
    const isAuthenticated = !!(user && user.token);
    const wasAuthenticated = wasAuthenticatedRef.current;

    // User just logged in (was not authenticated, now is)
    if (wasAuthenticated === false && isAuthenticated) {
      setCacheBusterCookie();
      // Force reload to ensure fresh content (handles bookmarked pages)
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }

    // User just logged out (was authenticated, now is not)
    if (wasAuthenticated === true && !isAuthenticated) {
      removeCacheBusterCookie();
    }

    wasAuthenticatedRef.current = isAuthenticated;
  }, [user]);

  return null;
}
