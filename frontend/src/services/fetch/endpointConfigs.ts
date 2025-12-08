import { environment } from "src/constants/environments";
import { ApiMethod } from "src/services/fetch/fetcherHelpers";

export interface EndpointConfig {
  allowedErrorStatuses?: number[];
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

export const toDynamicApplicationsEndpoint = (
  type: "POST" | "GET" | "PUT" | "DELETE",
) => {
  return {
    allowedErrorStatuses: [422],
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

export const toDynamicUsersEndpoint = (
  type: "POST" | "DELETE" | "PUT" | "GET",
) => {
  return {
    basePath: environment.API_URL,
    version: "v1",
    namespace: "users",
    method: type as ApiMethod,
  };
};

export const userRefreshEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "users/token/refresh",
  method: "POST" as ApiMethod,
};

export const searchAgenciesEndpoint = {
  basePath: environment.API_URL,
  version: "v1",
  namespace: "agencies/search",
  method: "POST" as ApiMethod,
};

export const toDynamicOrganizationsEndpoint = (
  type: "POST" | "DELETE" | "PUT" | "GET",
) => {
  return {
    basePath: environment.API_URL,
    version: "v1",
    namespace: "organizations",
    method: type as ApiMethod,
  };
};

export const getLocalUsersEndpoint = {
  basePath: environment.API_URL,
  version: "",
  namespace: "local/local-users",
  method: "GET" as ApiMethod,
};
