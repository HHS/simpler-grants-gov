import "server-only";

import {
  LOGIN_REDIRECT_FALLBACK_COOKIE,
  LOGIN_REDIRECT_FALLBACK_COOKIE_MAX_AGE_SECONDS,
} from "src/constants/auth";
import { environment } from "src/constants/environments";
import { isSafeLoginRedirect } from "src/utils/userUtils";

import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/*
  LoginLink saves the post-sign-in destination to sessionStorage in a click
  handler that only exists after hydration. A "Sign in" click before hydration
  saves nothing, so /api/auth/login also records the same-origin Referer in a
  short-lived cookie that /login uses when sessionStorage has no valid destination.

  Trade-off: the cookie is shared across tabs, so simultaneous pre-hydration
  sign-ins in different tabs can overwrite each other. Hydrated clicks are
  unaffected because tab-local sessionStorage always wins.
*/

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

// with no destination, clear any stale fallback so an earlier attempt's is never reused
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
    maxAge: LOGIN_REDIRECT_FALLBACK_COOKIE_MAX_AGE_SECONDS,
  });
};

// raw cookie value: the consumer must validate it before redirecting
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
