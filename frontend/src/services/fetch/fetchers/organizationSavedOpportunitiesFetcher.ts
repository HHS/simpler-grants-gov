"server-only";

import { fetchOrganizationWithMethod } from "src/services/fetch/fetchers/fetchers";

export type OrganizationSavedOpportunityParams = {
  organizationId: string;
  opportunityId: string;
};

export const saveOpportunityForOrganization = async ({
  organizationId,
  opportunityId,
}: OrganizationSavedOpportunityParams): Promise<Response> => {
  return fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/saved-opportunities`,
    body: {
      opportunity_id: opportunityId,
    },
  });
};

export const deleteSavedOpportunityForOrganization = async ({
  organizationId,
  opportunityId,
}: OrganizationSavedOpportunityParams): Promise<Response> => {
  return fetchOrganizationWithMethod("DELETE")({
    subPath: `${organizationId}/saved-opportunities/${opportunityId}`,
  });
};
