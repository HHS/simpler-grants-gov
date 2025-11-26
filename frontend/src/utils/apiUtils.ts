import { logResponse } from "src/services/logger/simplerLogger";

import { NextRequest } from "next/server";

const AWSTraceIDHeader = "X-Amz-Cf-Id";

type HandlerOptions<T> = { params: Promise<T> };

type SimplerHandler<T> = (
  request: NextRequest,
  options: HandlerOptions<T>,
) => Promise<Response>;

// adds trace id header to response
// logs response
export const respondWithTraceAndLogs =
  <Params = object>(handler: SimplerHandler<Params>) =>
  async (request: NextRequest, options: HandlerOptions<Params>) => {
    const response = await handler(request, options || {});
    response.headers.append(
      AWSTraceIDHeader,
      request.headers.get(AWSTraceIDHeader) || "",
    );
    // hack to get the response url available to logger
    response.headers.append("simpler-request-for", request.url);
    logResponse(response);
    return response;
  };

// Safely returns the backend's message field from a
// parsed error response, or undefined if unavailable.
export function getBackendMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const maybe = body as { message?: unknown };
  return typeof maybe.message === "string" ? maybe.message : undefined;
}
