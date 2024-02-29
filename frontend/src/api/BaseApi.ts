import { compact } from "lodash";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
export interface JSONRequestBody {
  [key: string]: unknown;
}

export interface ApiResponseBody<TResponseData> {
  message: string;
  data: TResponseData;
  status_code: number;
  errors?: unknown[]; // TODO: define error and warning Issue type
  warnings?: unknown[];
}

export interface HeadersDict {
  [header: string]: string;
}

export default abstract class BaseApi {
  /**
   * Root path of API resource without leading slash.
   */
  abstract get basePath(): string;

  /**
   * Namespace representing the API resource.
   */
  abstract get namespace(): string;

  /**
   * Configuration of headers to send with all requests
   * Can include feature flags in child classes
   */
  get headers() {
    return {};
  }

  /**
   * Send an API request.
   */
  async request<TResponseData>(
    method: ApiMethod,
    subPath = "",
    body?: JSONRequestBody,
    options: {
      additionalHeaders?: HeadersDict;
    } = {},
  ) {
    const { additionalHeaders = {} } = options;
    const url = createRequestUrl(method, this.basePath, subPath, body);
    const headers: HeadersDict = {
      ...additionalHeaders,
      ...this.headers,
    };

    headers["Content-Type"] = "application/json";

    const response = await this.sendRequest<TResponseData>(url, {
      body: method === "GET" || !body ? null : createRequestBody(body),
      headers,
      method,
    });

    return response;
  }

  /**
   * Send a request and handle the response
   */
  private async sendRequest<TResponseData>(
    url: string,
    fetchOptions: RequestInit,
  ) {
    let response: Response;
    let responseBody: ApiResponseBody<TResponseData>;

    try {
      response = await fetch(url, fetchOptions);
      responseBody = (await response.json()) as ApiResponseBody<TResponseData>;
    } catch (error) {
      console.log("Network Error encountered => ", error);
      throw new Error("Network request failed");
      // TODO: Error management
      // throw fetchErrorToNetworkError(error);
    }

    const { data, errors, warnings } = responseBody;
    if (!response.ok) {
      console.log(
        "Not OK Response => ",
        response,
        errors,
        this.namespace,
        data,
      );

      throw new Error("Not OK response received");
      // TODO: Error management
      // handleNotOkResponse(response, errors, this.namespace, data);
    }

    return {
      data,
      warnings,
    };
  }
}

export function createRequestUrl(
  method: ApiMethod,
  basePath: string,
  subPath: string,
  body?: JSONRequestBody,
) {
  // Remove leading slash from apiPath if it has one
  const cleanedPaths = compact([basePath, subPath]).map(removeLeadingSlash);
  let url = [process.env.apiUrl, ...cleanedPaths].join("/");

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
