import { ExternalRoutes } from "src/constants/routes";

export const legacyOpportunityUrl = (id: number): string =>
  `${ExternalRoutes.GRANTS_HOME}/search-results-detail/${id}`;

export const getOpportunityUrl = (opportunityId: string): string =>
  `/opportunity/${opportunityId}`;
