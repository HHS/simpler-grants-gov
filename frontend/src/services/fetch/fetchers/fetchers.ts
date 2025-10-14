import "server-only";

import { ApiRequestError } from "src/errors";
import {
  EndpointConfig,
  fetchCompetitionEndpoint,
  fetchFormEndpoint,
  fetchOpportunityEndpoint,
  opportunitySearchEndpoint,
  searchAgenciesEndpoint,
  toDynamicApplicationsEndpoint,
  toDynamicOrganizationsEndpoint,
  toDynamicUsersEndpoint,
  userLogoutEndpoint,
  userRefreshEndpoint,
} from "src/services/fetch/endpointConfigs";
import {
  createRequestBody,
  createRequestUrl,
  fetchErrorToNetworkError,
  getDefaultHeaders,
  HeadersDict,
  JSONRequestBody,
  throwError,
} from "src/services/fetch/fetcherHelpers";
import { APIResponse } from "src/types/apiResponseTypes";

import { cache } from "react";

// returns a function which can be used to make a request to an endpoint defined in the passed config
// note that subpath is dynamic per request, any static paths at this point would need to be included in the namespace
// returns the full api response, dealing with parsing the body will happen explicitly for each request type
export function requesterForEndpoint({
  method,
  basePath,
  version,
  namespace,
  allowedErrorStatuses = [],
}: EndpointConfig) {
  return async function (
    options: {
      subPath?: string;
      body?: JSONRequestBody;
      additionalHeaders?: HeadersDict;
      nextOptions?: NextFetchRequestConfig;
    } = {},
  ): Promise<Response> {
    const { additionalHeaders = {}, body, subPath, nextOptions } = options;
    const url = createRequestUrl(
      method,
      basePath,
      version,
      namespace,
      subPath,
      body,
    );
    const headers: HeadersDict = {
      ...getDefaultHeaders(),
      ...additionalHeaders,
    };

    let response;
    try {
      response = await fetch(url, {
        body: method === "GET" || !body ? null : createRequestBody(body),
        headers,
        method,
        next: nextOptions,
      });
    } catch (e) {
      // API most likely down, but also possibly an error setting up or sending a request
      // or parsing the response.
      throw fetchErrorToNetworkError(e);
    }

    if (
      !response.ok &&
      response.headers.get("Content-Type") === "application/json" &&
      !allowedErrorStatuses.includes(response.status)
    ) {
      // we can assume this is serializable json based on the response header, but we'll catch anyway
      let jsonBody;
      try {
        jsonBody = (await response.json()) as APIResponse;
      } catch (e) {
        throw new Error(
          `bad Json from error response at ${url} with status code ${response.status}`,
        );
      }
      return throwError(jsonBody, url);
    } else if (
      !response.ok &&
      !allowedErrorStatuses.includes(response.status)
    ) {
      throw new ApiRequestError(
        `unable to fetch ${url}`,
        "APIRequestError",
        response.status,
      );
    }

    return response;
  };
}
export const fetchOpportunity = cache(
  requesterForEndpoint(fetchOpportunityEndpoint),
);

export const fetchForm = cache(requesterForEndpoint(fetchFormEndpoint));

export const fetchCompetition = cache(
  requesterForEndpoint(fetchCompetitionEndpoint),
);

export const fetchApplicationWithMethod = (
  type: "POST" | "GET" | "PUT" | "DELETE",
) => requesterForEndpoint(toDynamicApplicationsEndpoint(type));

export const fetchOpportunitySearch = requesterForEndpoint(
  opportunitySearchEndpoint,
);

export const postUserLogout = requesterForEndpoint(userLogoutEndpoint);

export const fetchUserWithMethod = (type: "POST" | "DELETE" | "PUT" | "GET") =>
  requesterForEndpoint(toDynamicUsersEndpoint(type));

export const postTokenRefresh = requesterForEndpoint(userRefreshEndpoint);

export const searchAgencies = requesterForEndpoint(searchAgenciesEndpoint);

export const fetchOrganizationWithMethod = (
  type: "POST" | "DELETE" | "PUT" | "GET",
) => requesterForEndpoint(toDynamicOrganizationsEndpoint(type));
