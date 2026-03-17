"server-only";

import { getSession } from "src/services/auth/session";
import { fetchOrganizationWithMethod } from "src/services/fetch/fetchers/fetchers";
import { MinimalOpportunity } from "src/types/opportunity/opportunityResponseTypes";

export type OrganizationSavedOpportunityParams = {
  organizationId: string;
  opportunityId: string;
  token: string;
};

type ListSavedOpportunitiesForOrganizationResponse = {
  data: MinimalOpportunity[];
  message: string;
  status_code: number;
  errors?: unknown[];
  internal_request_id?: string;
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

export const getSavedOpportunitiesForOrganization = async (
  organizationId: string,
): Promise<MinimalOpportunity[]> => {
  const session = await getSession();

  if (!session || !session.token) {
    return [];
  }

  const response = await fetchOrganizationWithMethod("POST")({
    subPath: `${organizationId}/saved-opportunities/list`,
    additionalHeaders: { "X-SGG-Token": session.token },
    body: {
      pagination: {
        page_offset: 1,
        page_size: 1000,
        sort_order: [
          {
            order_by: "created_at",
            sort_direction: "descending",
          },
        ],
      },
    },
    nextOptions: {
      tags: [`organization-saved-opportunities-${organizationId}`],
    },
  });

  const responseJson =
    (await response.json()) as ListSavedOpportunitiesForOrganizationResponse;

  if (!response.ok || responseJson.status_code !== 200) {
    return [];
  }

  return responseJson.data ?? [];
};
