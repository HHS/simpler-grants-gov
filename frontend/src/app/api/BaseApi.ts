// This server-only package is recommended by Next.js to ensure code is only run on the server.
// It provides a build-time error if client-side code attempts to invoke the code here.
// Since we're pulling in an API Auth Token here, this should be server only
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

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
import { compact, isEmpty } from "lodash";

// TODO (#1682): replace search specific references (since this is a generic API file that any
// future page or different namespace could use)
import { SearchAPIResponse } from "../../types/search/searchResponseTypes";
import { SearchFetcherProps } from "src/services/search/searchfetcher/SearchFetcher";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export interface JSONRequestBody {
  [key: string]: unknown;
}

interface APIResponseError {
  field: string;
  message: string;
  type: string;
}

export interface HeadersDict {
  [header: string]: string;
}

export default abstract class BaseApi {
  // Root path of API resource without leading slash.
  abstract get basePath(): string;

  // API version
  get version() {
    return "v0.1";
  }

  // Namespace representing the API resource
  abstract get namespace(): string;

  // Configuration of headers to send with all requests
  // Can include feature flags in child classes
  get headers(): HeadersDict {
    const headers: HeadersDict = {};

    if (process.env.API_AUTH_TOKEN) {
      headers["X-AUTH"] = process.env.API_AUTH_TOKEN;
    }
    return headers;
  }

  /**
   * Send an API request.
   */
  async request(
    method: ApiMethod,
    basePath: string,
    namespace: string,
    subPath: string,

    searchInputs: SearchFetcherProps,
    body?: JSONRequestBody,
    options: {
      additionalHeaders?: HeadersDict;
    } = {},
  ) {
    const { additionalHeaders = {} } = options;
    const url = createRequestUrl(
      method,
      basePath,
      this.version,
      namespace,
      subPath,
      body,
    );
    const headers: HeadersDict = {
      ...additionalHeaders,
      ...this.headers,
    };

    headers["Content-Type"] = "application/json";
    const response = await this.sendRequest(
      url,
      {
        body: method === "GET" || !body ? null : createRequestBody(body),
        headers,
        method,
      },
      searchInputs,
    );

    return response;
  }

  /**
   * Send a request and handle the response
   */
  private async sendRequest(
    url: string,
    fetchOptions: RequestInit,
    searchInputs: SearchFetcherProps,
  ) {
    let response: Response;
    let responseBody: SearchAPIResponse;
    try {
      response = await fetch(url, fetchOptions);
      responseBody = (await response.json()) as SearchAPIResponse;
    } catch (error) {
      // API most likely down, but also possibly an error setting up or sending a request
      // or parsing the response.
      throw fetchErrorToNetworkError(error, searchInputs);
    }

    const { data, message, pagination_info, status_code, warnings } =
      responseBody;
    if (!response.ok) {
      handleNotOkResponse(responseBody, message, status_code, searchInputs);
    }

    return {
      data,
      message,
      pagination_info,
      status_code,
      warnings,
    };
  }
}

export function createRequestUrl(
  method: ApiMethod,
  basePath: string,
  version: string,
  namespace: string,
  subPath: string,
  body?: JSONRequestBody,
) {
  // Remove leading slash
  const cleanedPaths = compact([basePath, version, namespace, subPath]).map(
    removeLeadingSlash,
  );
  let url = [...cleanedPaths].join("/");
  if (method === "GET" && body && !(body instanceof FormData)) {
    // Append query string to URL
    const searchBody: { [key: string]: string } = {};
    Object.entries(body).forEach(([key, value]) => {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      searchBody[key] = stringValue;
    });

    const params = new URLSearchParams(searchBody).toString();
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
function createRequestBody(payload?: JSONRequestBody): XMLHttpRequestBodyInit {
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
  searchInputs: SearchFetcherProps,
) {
  // Request failed to send or something failed while parsing the response
  // Log the JS error to support troubleshooting
  console.error(error);
  return new NetworkError(error, searchInputs);
}

function handleNotOkResponse(
  response: SearchAPIResponse,
  message: string,
  status_code: number,
  searchInputs: SearchFetcherProps,
) {
  const { errors } = response;
  if (isEmpty(errors)) {
    // No detailed errors provided, throw generic error based on status code
    throwError(message, status_code, searchInputs);
  } else {
    if (errors) {
      const firstError = errors[0] as APIResponseError;
      throwError(message, status_code, searchInputs, firstError);
    }
  }
}

const throwError = (
  message: string,
  status_code: number,
  searchInputs: SearchFetcherProps,
  firstError?: APIResponseError,
) => {
  console.log("Throwing error: ", message, status_code, searchInputs);

  // Include just firstError for now, we can expand this
  // If we need ValidationErrors to be more expanded
  const error = firstError ? { message, firstError } : { message };
  switch (status_code) {
    case 400:
      throw new BadRequestError(error, searchInputs);
    case 401:
      throw new UnauthorizedError(error, searchInputs);
    case 403:
      throw new ForbiddenError(error, searchInputs);
    case 404:
      throw new NotFoundError(error, searchInputs);
    case 422:
      throw new ValidationError(error, searchInputs);
    case 408:
      throw new RequestTimeoutError(error, searchInputs);
    case 500:
      throw new InternalServerError(error, searchInputs);
    case 503:
      throw new ServiceUnavailableError(error, searchInputs);
    default:
      throw new ApiRequestError(
        error,
        searchInputs,
        "APIRequestError",
        status_code,
      );
  }
};
