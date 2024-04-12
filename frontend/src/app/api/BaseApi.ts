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
} from "src/errors";

import { SearchAPIResponse } from "../../types/search/searchResponseTypes";
import { SearchFetcherProps } from "src/services/search/searchfetcher/SearchFetcher";
import { compact } from "lodash";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export interface JSONRequestBody {
  [key: string]: unknown;
}

// TODO: keep for reference on generic response type

// export interface ApiResponseBody<TResponseData> {
//   message: string;
//   data: TResponseData;
//   status_code: number;

//   errors?: unknown[]; // TODO: define error and warning Issue type
//   warnings?: unknown[];
// }

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
      throw fetchErrorToNetworkError(error, searchInputs);
    }

    const { data, message, pagination_info, status_code, errors, warnings } =
      responseBody;
    if (!response.ok) {
      console.log(
        "Not OK Response => ",
        response,
        errors,
        this.namespace,
        data,
      );

      if (errors && Array.isArray(errors)) {
        for (const error of errors) {
          if (error) {
            throwError(error, searchInputs, response);
          }
        }
      }
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

const throwError = (
  error: unknown,
  searchInputs: SearchFetcherProps,
  response: Response,
) => {
  const { status } = response;

  switch (status) {
    case 400:
      throw new BadRequestError(error, searchInputs);
    case 401:
      throw new UnauthorizedError(error, searchInputs);
    case 403:
      throw new ForbiddenError(error, searchInputs);
    case 404:
      throw new NotFoundError(error, searchInputs);
    case 408:
      throw new RequestTimeoutError(error, searchInputs);
    case 500:
      throw new InternalServerError(error, searchInputs);
    case 503:
      throw new ServiceUnavailableError(error, searchInputs);
    default:
      throw new ApiRequestError(error, searchInputs, "APIRequestError", status);
  }
};
