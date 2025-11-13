"use client";

import { useUser } from "src/services/auth/useUser";
import { addCacheBuster } from "src/utils/cacheBuster";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Global navigation interceptor that adds cache busters to link clicks
 * for authenticated users. This prevents browser caching issues.
 *
 * This works by intercepting Next.js Link navigation and modifying
 * the href before the navigation occurs.
 */
export function NavigationCacheBuster() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const routerRef = useRef(router);
  const userRef = useRef(user);
  const processedLinks = useRef(new WeakSet<HTMLAnchorElement>());
  // Value of wasAuthenticatedRef can be null if the component is not mounted yet or not checked yet 
  const wasAuthenticatedRef = useRef<boolean | null>(null);

  // Keep router and user refs updated
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Clean current URL when user logs out (transition from authenticated to not authenticated)
  useEffect(() => {
    const isAuthenticated = !!(user && user.token);
    const wasAuthenticated = wasAuthenticatedRef.current;

    // Only clean URL if user just logged out (was authenticated, now is not)
    if (
      wasAuthenticated === true &&
      !isAuthenticated &&
      typeof window !== "undefined"
    ) {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has("_cb")) {
        currentUrl.searchParams.delete("_cb");
        const cleanUrl =
          currentUrl.pathname + currentUrl.search + currentUrl.hash;
        routerRef.current.replace(cleanUrl);
      }
    }

    // Update the ref for next render
    wasAuthenticatedRef.current = isAuthenticated;
  }, [user]);

  // Monitor and modify links when they're rendered
  useEffect(() => {
    // Modify all links on the page to include cache busters (only when authenticated)
    const modifyLinks = () => {
      const links = document.querySelectorAll("a[href]");
      links.forEach((link) => {
        const anchor = link as HTMLAnchorElement;

        // Skip if already processed
        if (processedLinks.current.has(anchor)) return;

        try {
          const url = new URL(anchor.href);
          const currentUrl = new URL(window.location.href);

          // Only modify same-origin links
          if (url.origin !== currentUrl.origin) return;

          // Don't modify download links or external links
          if (anchor.hasAttribute("download") || anchor.target === "_blank") {
            return;
          }

          // Mark as processed
          processedLinks.current.add(anchor);

          // Add click listener to this specific link
          const handleClick = (e: Event) => {
            // Check authentication at click time
            const currentUser = userRef.current;
            const isAuthenticated = !!(currentUser && currentUser.token);

            // Only intercept if authenticated (need to add cache buster)
            // or if URL has cache buster that needs to be removed
            const clickedUrl = new URL(anchor.href);
            const hasCacheBuster = clickedUrl.searchParams.has("_cb");

            if (!isAuthenticated && !hasCacheBuster) {
              // Not authenticated and no cache buster - let browser handle normally
              return;
            }

            e.preventDefault();
            e.stopPropagation();

            // Re-parse the URL at click time to get the current href value
            try {
              // Remove existing _cb parameter if present
              clickedUrl.searchParams.delete("_cb");
              const pathWithQuery =
                clickedUrl.pathname + clickedUrl.search + clickedUrl.hash;

              // Only add cache buster if authenticated
              const finalUrl = isAuthenticated
                ? addCacheBuster(pathWithQuery)
                : pathWithQuery;

              // Use Next.js router
              routerRef.current.push(finalUrl);
            } catch (err) {
              // If URL parsing fails, let the default navigation happen
            }
          };

          anchor.addEventListener("click", handleClick, { capture: true });
        } catch (error) {
          // Invalid URL, skip
        }
      });
    };

    // Initial modification
    modifyLinks();

    // Watch for new links being added to the DOM
    const observer = new MutationObserver(() => {
      modifyLinks();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also handle clicks globally as a fallback
    const globalClickHandler = (e: MouseEvent) => {
      // Check authentication at click time using the ref to get latest value
      const currentUser = userRef.current;
      const clickTimeAuthenticated = !!(currentUser && currentUser.token);

      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link || !link.href) return;

      try {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);

        // Only intercept same-origin links
        if (url.origin !== currentUrl.origin) {
          return;
        }

        // Don't intercept download links or external links
        if (link.hasAttribute("download") || link.target === "_blank") {
          return;
        }

        // Check if URL has a cache buster
        const hasCacheBuster = url.searchParams.has("_cb");

        // If not authenticated
        if (!clickTimeAuthenticated) {
          // If URL has a cache buster, remove it
          if (hasCacheBuster) {
            e.preventDefault();
            e.stopPropagation();

            const urlObj = new URL(link.href);
            urlObj.searchParams.delete("_cb");
            const cleanUrl = urlObj.pathname + urlObj.search + urlObj.hash;

            routerRef.current.push(cleanUrl);
          }
          // No cache buster, allow normal navigation
          return;
        }

        // User is authenticated - add cache buster

        // Prevent default and navigate with cache buster
        e.preventDefault();
        e.stopPropagation();

        // Remove existing _cb parameter if present, then add fresh one
        const urlObj = new URL(link.href);
        urlObj.searchParams.delete("_cb");
        const pathWithQuery = urlObj.pathname + urlObj.search + urlObj.hash;
        const bustedUrl = addCacheBuster(pathWithQuery);

        routerRef.current.push(bustedUrl);
      } catch (error) {
        // Let browser handle invalid URLs
      }
    };

    document.addEventListener("click", globalClickHandler, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", globalClickHandler, true);
      processedLinks.current = new WeakSet<HTMLAnchorElement>();
    };
  }, [user, pathname]);

  return null;
}
