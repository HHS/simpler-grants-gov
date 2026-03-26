"server-only";

import { fetchOrganizationWithMethod } from "src/services/fetch/fetchers/fetchers";

export type OrganizationSavedOpportunityParams = {
  organizationId: string;
  opportunityId: string;
  token: string;
};

export const saveOpportunityForOrganization = async ({
  organizationId,
  opportunityId,
  token,
}: OrganizationSavedOpportunityParams): Promise<Response> => {
  return fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/saved-opportunities`,
    additionalHeaders: { "X-SGG-Token": token },
    body: {
      opportunity_id: opportunityId,
    },
  });
};

export const deleteSavedOpportunityForOrganization = async ({
  organizationId,
  opportunityId,
  token,
}: OrganizationSavedOpportunityParams): Promise<Response> => {
  return fetchOrganizationWithMethod("DELETE")({
    subPath: `${organizationId}/saved-opportunities/${opportunityId}`,
    additionalHeaders: { "X-SGG-Token": token },
  });
};
