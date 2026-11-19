import "server-only";

import {
  LOGIN_REDIRECT_FALLBACK_COOKIE,
  LOGIN_REDIRECT_FALLBACK_COOKIE_MAX_AGE,
} from "src/constants/auth";
import { environment } from "src/constants/environments";
import { isSafeLoginRedirect } from "src/utils/userUtils";

import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/*
  Server-side fallback for the post-sign-in destination.

  The primary mechanism is the tab-local sessionStorage value saved by LoginLink's
  click handler. That handler only exists after hydration, so a "Sign in" click
  before hydration reaches /api/auth/login without saving anything. As a fallback,
  /api/auth/login records the same-origin Referer (pathname + query only) in a
  short-lived cookie, and /login uses it only when sessionStorage has no valid
  destination.

  Cookies are shared across tabs, so two simultaneous pre-hydration sign-ins in
  different tabs can overwrite each other's fallback. Hydrated clicks are
  unaffected because sessionStorage is per tab and always takes precedence.
*/

// Returns the root-relative pathname + query of a same-origin Referer, or null
// when the Referer is missing, malformed, cross-origin, or not a safe destination.
export const getRefererLoginDestination = (
  request: NextRequest,
): string | null => {
  const referer = request.headers.get("referer");
  if (!referer) {
    return null;
  }
  let refererUrl: URL;
  try {
    refererUrl = new URL(referer);
  } catch {
    return null;
  }
  if (refererUrl.protocol !== "https:" && refererUrl.protocol !== "http:") {
    return null;
  }
  // Behind the load balancer request.nextUrl can carry an internal host, while the
  // Host header is the one the browser used (see resolveExternalRequestUrl), so the
  // Referer may match either. Scheme is not compared because TLS terminates
  // upstream of the app.
  const appHosts = [request.headers.get("host"), request.nextUrl.host].filter(
    Boolean,
  );
  if (!appHosts.includes(refererUrl.host)) {
    return null;
  }
  const destination = `${refererUrl.pathname}${refererUrl.search}`;
  return isSafeLoginRedirect(destination) ? destination : null;
};

// Stores the validated destination, or clears any stale fallback when there is none,
// so an earlier sign-in attempt's destination is never reused.
export const setLoginRedirectFallback = async (destination: string | null) => {
  const cookieStore = await cookies();
  if (!destination) {
    if (cookieStore.get(LOGIN_REDIRECT_FALLBACK_COOKIE)) {
      cookieStore.delete({ name: LOGIN_REDIRECT_FALLBACK_COOKIE, path: "/" });
    }
    return;
  }
  cookieStore.set(LOGIN_REDIRECT_FALLBACK_COOKIE, destination, {
    httpOnly: true,
    secure: environment.ENVIRONMENT === "prod",
    sameSite: "lax",
    path: "/",
    maxAge: LOGIN_REDIRECT_FALLBACK_COOKIE_MAX_AGE,
  });
};

// Raw cookie value; the consumer must validate it before redirecting.
export const getLoginRedirectFallback = async (): Promise<
  string | undefined
> => {
  const cookieStore = await cookies();
  return cookieStore.get(LOGIN_REDIRECT_FALLBACK_COOKIE)?.value;
};

export const clearLoginRedirectFallback = async () => {
  const cookieStore = await cookies();
  // explicit path: without it the expiring cookie defaults to the request's path
  cookieStore.delete({ name: LOGIN_REDIRECT_FALLBACK_COOKIE, path: "/" });
};
