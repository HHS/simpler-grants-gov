import "server-only";

import {
  EndpointConfig,
  fetchOpportunityEndpoint,
  opportunitySearchEndpoint,
} from "src/app/api/EndpointConfigs";
import {
  createRequestBody,
  createRequestUrl,
  getDefaultHeaders,
  HeadersDict,
  JSONRequestBody,
  sendRequest,
} from "src/app/api/FetchHelpers";
import { APIResponse } from "src/types/apiResponseTypes";
import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";
import { QueryParamData } from "src/types/search/searchRequestTypes";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { cache } from "react";

// returns a function which can be used to make a request to an endpoint defined in the passed config
export function requesterForEndpoint<ResponseType extends APIResponse>({
  method,
  basePath,
  version,
  namespace,
}: EndpointConfig) {
  return async function (
    subPath: string,
    options: {
      queryParamData?: QueryParamData;
      body?: JSONRequestBody;
      additionalHeaders?: HeadersDict;
    } = {},
  ): Promise<ResponseType> {
    const { additionalHeaders = {}, body, queryParamData } = options;
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

    const response = await sendRequest<ResponseType>(
      url,
      {
        body: method === "GET" || !body ? null : createRequestBody(body),
        headers,
        method,
      },
      queryParamData,
    );

    return response;
  };
}

export const fetchOpportunity = cache(
  requesterForEndpoint<OpportunityApiResponse>(fetchOpportunityEndpoint),
);

export const requestOpportunitySearch = requesterForEndpoint<SearchAPIResponse>(
  opportunitySearchEndpoint,
);
