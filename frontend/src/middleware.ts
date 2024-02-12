/**
 * @file Middleware allows you to run code before a request is completed. Then, based on
 * the incoming request, you can modify the response by rewriting, redirecting,
 * modifying the request or response headers, or responding directly.
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
import { NextRequest, NextResponse } from "next/server";

import { FeatureFlagsManager } from "./services/FeatureFlagManager";

export const config = {
  matcher: [
    /*
     * Run Middleware on all request paths except these:
     * - Api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (static files in public/images/ directory)
     */
    "/((?!api|_next/static|_next/image|images|site.webmanifest).*)",
    /**
     * Fix issue where the pattern above was causing middleware
     * to not run on the homepage:
     */
    "/",
  ],
};

export function middleware(request: NextRequest): NextResponse {
  let response = NextResponse.next();

  const featureFlagsManager = new FeatureFlagsManager(request.cookies);
  response = featureFlagsManager.middleware(request, response);

  return response;
}
