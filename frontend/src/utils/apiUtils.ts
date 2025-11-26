import { UnauthorizedError } from "src/errors";
import { logResponse } from "src/services/logger/simplerLogger";

import { NextRequest } from "next/server";

const AWSTraceIDHeader = "X-Amz-Cf-Id";

type HandlerOptions<T> = { params: Promise<T> };

type SimplerHandler<T> = (
  request: NextRequest,
  options: HandlerOptions<T>,
) => Promise<Response>;

interface ThrowOnApiErrorOptions {
  operationName: string;
  unauthorizedMessage: string;
  unauthorizedStatus?: number;
}

interface ApiResponse {
  status: number;
  json: () => Promise<unknown>;
}

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
export function getBackendErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const typedErrorBody = body as { message?: unknown };
  return typeof typedErrorBody.message === "string"
    ? typedErrorBody.message
    : undefined;
}

export async function throwOnApiError(
  resp: ApiResponse,
  {
    operationName,
    unauthorizedMessage,
    unauthorizedStatus = 401,
  }: ThrowOnApiErrorOptions,
): Promise<never> {
  let backendMessage: string | undefined;

  try {
    const body = await resp.json();
    backendMessage = getBackendErrorMessage(body);
  } catch {
    console.warn(`Failed to parse error body for ${operationName}`);
  }

  if (resp.status === unauthorizedStatus) {
    throw new UnauthorizedError(backendMessage ?? unauthorizedMessage);
  }

  const error = new Error(
    `${operationName} failed with status ${resp.status}${
      backendMessage ? `: ${backendMessage}` : ""
    }`,
  );

  (error as { status?: number }).status = resp.status;

  throw error;
}
