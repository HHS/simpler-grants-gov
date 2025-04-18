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

export const fetchCompetitionEndpoint = {
  basePath: environment.API_URL,
  version: "alpha",
  namespace: "competitions",
  method: "GET" as ApiMethod,
};

export const toDynamicApplicationsEndpoint = (type: "POST" | "GET" | "PUT") => {
  return {
    basePath: environment.API_URL,
    version: "alpha",
    namespace: "applications",
    method: type as ApiMethod,
  };
};

export const fetchFormEndpoint = {
  basePath: environment.API_URL,
  version: "alpha",
  namespace: "forms",
  method: "GET" as ApiMethod,
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

// can expand to support GET when the time comes
export const toDynamicUsersEndpoint = (type: "POST" | "DELETE" | "PUT") => {
  return {
    basePath: environment.API_URL,
    version: "v1",
    namespace: "users",
    method: type as ApiMethod,
  };
};

export const fetchAgenciesEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "agencies",
  method: "POST" as ApiMethod,
};
