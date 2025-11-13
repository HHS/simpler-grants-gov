import { logResponse } from "src/services/logger/simplerLogger";

import { NextRequest } from "next/server";

const AWSTraceIDHeader = "X-Amz-Cf-Id";

type HandlerOptions<T> = { params: Promise<T> };

type SimplerHandler<T> = (
  request: NextRequest,
  options: HandlerOptions<T>,
) => Promise<Response>;

/**
 * No-cache headers to prevent CloudFront and browser caching of API responses.
 */
export const noCacheHeaders = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/**
 * Apply no-cache headers to a Response object.
 * Ensures API responses are never cached by CDN or browser.
 */
export const addNoCacheHeaders = (response: Response): void => {
  Object.entries(noCacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
};

// adds trace id header to response
// logs response
export const respondWithTraceAndLogs =
  <Params = object>(handler: SimplerHandler<Params>) =>
  async (request: NextRequest, options: HandlerOptions<Params>) => {
    const response = await handler(request, options || {});

    // Add no-cache headers to ALL API responses
    addNoCacheHeaders(response);

    response.headers.append(
      AWSTraceIDHeader,
      request.headers.get(AWSTraceIDHeader) || "",
    );

    response.headers.append("simpler-request-for", request.url);
    logResponse(response);
    return response;
  };
