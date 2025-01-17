import "server-only";

import { compact, isEmpty } from "lodash";
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
import { APIResponse } from "src/types/apiResponseTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export interface JSONRequestBody {
  [key: string]: unknown;
}

export interface HeadersDict {
  [header: string]: string;
}

// Configuration of headers to send with all requests
// Can include feature flags in child classes
export function getDefaultHeaders(): HeadersDict {
  const headers: HeadersDict = {};

  if (environment.API_AUTH_TOKEN) {
    headers["X-AUTH"] = environment.API_AUTH_TOKEN;
  }
  headers["Content-Type"] = "application/json";
  return headers;
}

/**
 * Send a request and handle the response
 * @param queryParamData: note that this is only used in error handling in order to help restore original page state
 */
export async function sendRequest<ResponseType extends APIResponse>(
  url: string,
  fetchOptions: RequestInit,
  queryParamData?: QueryParamData,
): Promise<ResponseType> {
  let response;
  let responseBody;
  try {
    response = await fetch(url, fetchOptions);
    responseBody = (await response.json()) as ResponseType;
  } catch (error) {
    // API most likely down, but also possibly an error setting up or sending a request
    // or parsing the response.
    throw fetchErrorToNetworkError(error, queryParamData);
  }
  if (!response.ok) {
    handleNotOkResponse(responseBody, url, queryParamData);
  }

  return responseBody;
}

export function createRequestUrl(
  method: ApiMethod,
  basePath: string,
  version: string,
  namespace: string,
  subPath = "",
  body?: JSONRequestBody,
) {
  // Remove leading slash
  const cleanedPaths = compact([basePath, version, namespace, subPath]).map(
    removeLeadingSlash,
  );
  let url = [...cleanedPaths].join("/");
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
 * Remove leading slash
 */
function removeLeadingSlash(path: string) {
  return path.replace(/^\//, "");
}

/**
 * Transform the request body into a format that fetch expects
 */
export function createRequestBody(
  payload?: JSONRequestBody,
): XMLHttpRequestBodyInit {
  if (payload instanceof FormData) {
    return payload;
  }

  return JSON.stringify(payload);
}

/**
 * Handle request errors
 */
function fetchErrorToNetworkError(
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

// note that this will pass along filter inputs in order to maintain the state
// of the page when relaying an error, but anything passed in the body of the request,
// such as keyword search query will not be included
function handleNotOkResponse(
  response: APIResponse,
  url: string,
  searchInputs?: QueryParamData,
) {
  const { errors } = response;
  if (isEmpty(errors)) {
    // No detailed errors provided, throw generic error based on status code
    throwError(response, url, searchInputs);
  } else {
    if (errors) {
      const firstError = errors[0];
      throwError(response, url, searchInputs, firstError);
    }
  }
}

export const throwError = (
  response: APIResponse,
  url: string,
  searchInputs?: QueryParamData,
  firstError?: unknown,
) => {
  const { status_code = 0, message = "" } = response;
  console.error(
    `API request error at ${url} (${status_code}): ${message}`,
    searchInputs,
  );

  const details = {
    searchInputs,
    ...(firstError || {}),
  };
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
