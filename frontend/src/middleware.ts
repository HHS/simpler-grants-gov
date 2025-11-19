/**
 * @file Middleware allows you to run code before a request is completed. Then, based on
 * the incoming request, you can modify the response by rewriting, redirecting,
 * modifying the request or response headers, or responding directly.
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
import { defaultLocale, locales } from "src/i18n/config";
import { featureFlagsManager } from "src/services/featureFlags/FeatureFlagManager";

import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { environment } from "./constants/environments";
import { logRequest } from "./services/logger/simplerLogger";

export const config = {
  matcher: [
    /*
     * Run Middleware on all request paths except these:
     * - Api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (static files in public/images/ directory)
     */
    "/((?!_next/static|_next/image|sitemap|public|img|uswds|images|robots.txt|site.webmanifest|favicon.ico).*)",
    /**
     * Fix issue where the pattern above was causing middleware
     * to not run on the homepage:
     */
    "/",
  ],
};

/**
 * Detect the user's preferred language and redirect to a localized route
 * if the preferred language isn't the current locale.
 */
const i18nMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  // Don't prefix the URL with the locale when the locale is the default locale (i.e. "en-US")
  localePrefix: "as-needed",
});

export default function middleware(request: NextRequest): NextResponse {
  const cacheControl: string[] = [];

  // only allow for cdn testing/troubleshooting in lower envs
  if (
    request.url.includes("/cdn") &&
    ["dev", "local"].indexOf(environment.ENVIRONMENT) > -1
  ) {
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);

    const cacheControl: string[] = [];

    cacheControl.push(`max-age=${params.get("max-age") || "10"}`);
    cacheControl.push(
      params.get("cache") ||
        (request.cookies.has("session") &&
        request.cookies.get("session")?.value !== ""
          ? "no-store"
          : "public"),
    );

    return new NextResponse(
      JSON.stringify({ params: params.entries(), cacheControl }),
      {
        status: 200,
        headers: {
          "Cache-Control": cacheControl.join(", "),
          "Content-Type": "application/json",
        },
      },
    );
  }

  const response = request.url.match(/api\//)
    ? featureFlagsManager.middleware(request, NextResponse.next())
    : featureFlagsManager.middleware(request, i18nMiddleware(request));

  // in Next 15 there is an experimental `unauthorized` function that will send a 401
  // code to the client and display an unauthorized page
  // see https://nextjs.org/docs/app/api-reference/functions/unauthorized
  // For now we can set status codes on auth redirect errors here
  if (request.url.includes("/error")) {
    return new NextResponse(response.body, {
      status: 500,
      headers: response.headers,
    });
  }
  if (request.url.includes("/unauthorized")) {
    return new NextResponse(response.body, {
      status: 401,
      headers: response.headers,
    });
  }

  logRequest(request);

  if (
    request.cookies.has("session") &&
    request.cookies.get("session")?.value !== ""
  ) {
    cacheControl.push("no-store");
    cacheControl.push("max-age=0");
  }

  if (cacheControl.length > 0) {
    response.headers.set("Cache-Control", cacheControl.join(", "));
  }
  return response;
}
