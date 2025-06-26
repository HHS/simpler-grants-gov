import { ExternalRoutes } from "src/constants/routes";

export const legacyOpportunityUrl = (id: number): string =>
  `${ExternalRoutes.GRANTS_HOME}/search-results-detail/${id}`;
