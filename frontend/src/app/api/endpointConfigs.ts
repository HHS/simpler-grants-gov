import { ApiMethod } from "src/app/api/fetcherHelpers";
import { environment } from "src/constants/environments";

export interface EndpointConfig {
  basePath: string;
  version: string;
  namespace: string;
  method: ApiMethod;
}

export const opportunitySearchEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "opportunities/search",
  method: "POST" as ApiMethod,
};

export const fetchOpportunityEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "opportunities",
  method: "GET" as ApiMethod,
};
