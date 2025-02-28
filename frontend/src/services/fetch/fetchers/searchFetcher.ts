import "server-only";

import { fetchOpportunitySearch } from "src/services/fetch/fetchers/fetchers";
import {
  QueryParamData,
  SearchRequestBody,
} from "src/types/search/searchRequestTypes";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";
import {
  buildFilters,
  buildPagination,
  formatSearchRequestBody,
} from "src/utils/search/searchFormatUtils";

export const searchForOpportunities = async (searchInputs: QueryParamData) => {
  const requestBody = formatSearchRequestBody(searchInputs);
  const response = await fetchOpportunitySearch({
    body: requestBody,
  });

  const responseBody = (await response.json()) as SearchAPIResponse;

  responseBody.actionType = searchInputs.actionType;
  responseBody.fieldChanged = searchInputs.fieldChanged;

  if (!responseBody.data) {
    throw new Error("No data returned from Opportunity Search API");
  }
  return responseBody;
};

// this is very similar to `searchForOpportunities`, but
// * hardcodes some pagination params
// * sets format param = 'csv'
// * response body on success is not json, so does not parse it
export const downloadOpportunities = async (
  searchInputs: QueryParamData,
): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>> => {
  const { query } = searchInputs;
  const filters = buildFilters(searchInputs);
  const pagination = buildPagination(searchInputs);

  const requestBody: SearchRequestBody = {
    pagination: { ...pagination, page_size: 5000, page_offset: 1 },
  };

  if (Object.keys(filters).length > 0) {
    requestBody.filters = filters;
  }

  if (query) {
    requestBody.query = query;
  }

  const response = await fetchOpportunitySearch({
    body: { ...requestBody, format: "csv" },
  });

  if (!response.body) {
    throw new Error("No data returned from Opportunity Search API export");
  }

  return response.body;
};
