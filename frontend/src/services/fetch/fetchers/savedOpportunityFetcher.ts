"server-only";

import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { MinimalOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { SavedOpportunitiesScope } from "src/types/opportunity/savedOpportunitiesTypes";
import {
  getSavedOpportunitiesScopeOrganizationIds,
  INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
} from "src/utils/opportunity/savedOpportunitiesUtils";

export const handleSavedOpportunity = async (
  type: "DELETE" | "POST",
  userId: string,
  opportunityId: string,
) => {
  const subPath =
    type === "POST"
      ? `${userId}/saved-opportunities`
      : `${userId}/saved-opportunities/${opportunityId}`;

  const body =
    type === "POST"
      ? {
          opportunity_id: String(opportunityId),
        }
      : {};
  return fetchUserWithMethod(type)({
    subPath,
    body,
  });
};

export const getSavedOpportunities = async (
  userId: string,
  scope: SavedOpportunitiesScope,
  statusFilter?: string,
  organizationIdsFilter?: string[] | null,
): Promise<MinimalOpportunity[]> => {
  const organizationIds =
    organizationIdsFilter === undefined
      ? getSavedOpportunitiesScopeOrganizationIds(scope)
      : organizationIdsFilter;
  const body: {
    pagination: {
      page_offset: number;
      page_size: number;
      sort_order: { order_by: string; sort_direction: string }[];
    };
    filters: {
      opportunity_status?: { one_of: string[] };
      organization_ids: { one_of: string[] | null };
    };
  } = {
    pagination: {
      page_offset: 1,
      page_size: 5000,
      sort_order: [
        {
          order_by: "created_at",
          sort_direction: "descending",
        },
      ],
    },
    filters: {
      organization_ids: {
        one_of: organizationIds,
      },
    },
  };

  // Add status filter if provided
  if (statusFilter) {
    body.filters.opportunity_status = {
      one_of: [statusFilter],
    };
  }

  const subPath = `${userId}/saved-opportunities/list`;
  const response = await fetchUserWithMethod("POST")({
    subPath,
    body,
  });
  const json = (await response.json()) as { data: MinimalOpportunity[] };
  return json.data;
};

export const getUserSavedOpportunity = async (
  userId: string,
  opportunityId: string,
): Promise<MinimalOpportunity | null> => {
  const savedOpportunities = await getSavedOpportunities(
    userId,
    INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
  );
  const savedOpportunity = savedOpportunities.find(
    (savedOpportunity: { opportunity_id: string }) =>
      savedOpportunity.opportunity_id === opportunityId,
  );
  return savedOpportunity ?? null;
};

export const fetchSavedOpportunities = async (
  scope: SavedOpportunitiesScope,
  statusFilter?: string,
  organizationIdsFilter?: string[] | null,
): Promise<MinimalOpportunity[]> => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      return [];
    }
    const savedOpportunities = await getSavedOpportunities(
      session.user_id,
      scope,
      statusFilter,
      organizationIdsFilter,
    );
    return savedOpportunities;
  } catch (error: unknown) {
    console.error("Error fetching saved opportunities:", error);
    return [];
  }
};
