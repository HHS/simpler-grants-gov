import { environment } from "src/constants/environments";
import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";
import { SearchAPIResponse } from "src/types/search/searchResponseTypes";

import { ApiMethod, requesterForEndpoint } from "./FetchHelpers";

const fetchOpportunityEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "opportunities",
  method: "GET" as ApiMethod,
};

export const fetchOpportunity = requesterForEndpoint<OpportunityApiResponse>(
  fetchOpportunityEndpoint,
);

const opportunitySearchEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "search",
  method: "POST" as ApiMethod,
};

export const requestOpportunitySearch = requesterForEndpoint<SearchAPIResponse>(
  opportunitySearchEndpoint,
);
