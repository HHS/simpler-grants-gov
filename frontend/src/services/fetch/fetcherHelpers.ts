import "server-only";

import { compact } from "lodash";
import { environment } from "src/constants/environments";
import {
  ApiRequestError,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NetworkError,
  NotFoundError,
  RequestTimeoutError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from "src/errors";
import { getSession } from "src/services/auth/session";
import { APIResponse } from "src/types/apiResponseTypes";
import { ApiMethod } from "src/types/generalTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";

// Configuration of headers to send with all requests
// optionally adds content type and user auth token
export async function getDefaultHeaders({
  addContentType = true,
  requiresUserAuthToken = false,
}: {
  addContentType?: boolean;
  requiresUserAuthToken?: boolean;
}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (environment.API_GW_AUTH) {
    headers["X-API-KEY"] = environment.API_GW_AUTH;
  }

  if (environment.API_AUTH_TOKEN) {
    headers["X-AUTH"] = environment.API_AUTH_TOKEN;
  }
  if (addContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (requiresUserAuthToken) {
    const session = await getSession();
    if (!session?.token) {
      // May want to throw here
      console.warn("no user token present for authorized endpoint call");
    } else {
      headers["X-SGG-Token"] = session.token;
    }
  }

  return headers;
}

export function createRequestUrl(
  method: ApiMethod,
  basePath: string,
  version: string,
  namespace: string,
  subPath = "",
  body?: Record<string, unknown> | FormData,
) {
  const cleanedPaths = compact([basePath, version, namespace, subPath]);
  let url = [...cleanedPaths].map(removeRedundantSlashes).join("/");
  if (method === "GET" && body && !(body instanceof FormData)) {
    // Append query string to URL
    const newBody: { [key: string]: string } = {};
    Object.entries(body).forEach(([key, value]) => {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      newBody[key] = stringValue;
    });

    const params = new URLSearchParams(newBody).toString();
    url = `${url}?${params}`;
  }
  return url;
}

/**
 * Remove leading slash and (non protocol related) double slashes (in case a segment such a version is not provided)
 */
export function removeRedundantSlashes(path: string) {
  return path.replace(/^\//, "").replace(/(?<!:)\/\//g, "/");
}

/**
 * Transform the request body into a format that fetch expects
 */
export function createRequestBody(
  payload?: Record<string, unknown> | FormData,
): XMLHttpRequestBodyInit {
  if (payload instanceof FormData) {
    return payload;
  }

  return JSON.stringify(payload);
}

/**
 * Handle request errors
 */
export function fetchErrorToNetworkError(
  error: unknown,
  searchInputs?: QueryParamData,
) {
  // Request failed to send or something failed while parsing the response
  // Log the JS error to support troubleshooting
  console.error(error);
  return searchInputs
    ? new NetworkError(error, searchInputs)
    : new NetworkError(error);
}

export const throwError = (responseBody: APIResponse, url: string) => {
  const { status_code = 0, message = "", errors } = responseBody;
  console.error(`API request error at ${url} (${status_code}): ${message}`);

  const details = (errors && errors[0]) || {};

  switch (status_code) {
    case 400:
      throw new BadRequestError(message, details);
    case 401:
      throw new UnauthorizedError(message, details);
    case 403:
      throw new ForbiddenError(message, details);
    case 404:
      throw new NotFoundError(message, details);
    case 422:
      throw new ValidationError(message, details);
    case 408:
      throw new RequestTimeoutError(message, details);
    case 500:
      throw new InternalServerError(message, details);
    case 503:
      throw new ServiceUnavailableError(message, details);
    default:
      throw new ApiRequestError(
        message,
        "APIRequestError",
        status_code,
        details,
      );
  }
};
