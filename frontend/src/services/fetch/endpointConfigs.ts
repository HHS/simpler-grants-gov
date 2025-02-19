import { environment } from "src/constants/environments";
import { ApiMethod } from "src/services/fetch/fetcherHelpers";

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

export const userLogoutEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "users/token/logout",
  method: "POST" as ApiMethod,
};

export const userSavedOpportunityEndpoint = (
  type: "GET" | "POST" | "DELETE",
) => {
  return {
    basePath: environment.API_URL,
    version: "v1",
    namespace: "users",
    method: type as ApiMethod,
  };
};
