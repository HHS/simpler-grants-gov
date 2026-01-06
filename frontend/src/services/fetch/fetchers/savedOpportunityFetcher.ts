"server-only";

import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
import { MinimalOpportunity } from "src/types/opportunity/opportunityResponseTypes";

export const handleSavedOpportunity = async (
  type: "DELETE" | "POST",
  token: string,
  userId: string,
  opportunityId: string,
) => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
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
    additionalHeaders: ssgToken,
    body,
  });
};

export const getSavedOpportunities = async (
  token: string,
  userId: string,
  statusFilter?: string,
): Promise<MinimalOpportunity[]> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const body: {
    pagination: {
      page_offset: number;
      page_size: number;
      sort_order: { order_by: string; sort_direction: string }[];
    };
    filters?: {
      opportunity_status: { one_of: string[] };
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
  };

  // Add status filter if provided
  if (statusFilter) {
    body.filters = {
      opportunity_status: {
        one_of: [statusFilter],
      },
    };
  }

  const subPath = `${userId}/saved-opportunities/list`;
  const resp = await fetchUserWithMethod("POST")({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });
  const json = (await resp.json()) as { data: [] };
  return json.data;
};

export const getSavedOpportunity = async (
  token: string,
  userId: string,
  opportunityId: string,
): Promise<MinimalOpportunity | null> => {
  const savedOpportunities = await getSavedOpportunities(token, userId);
  const savedOpportunity = savedOpportunities.find(
    (savedOpportunity: { opportunity_id: string }) =>
      savedOpportunity.opportunity_id === opportunityId,
  );
  return savedOpportunity ?? null;
};

export const fetchSavedOpportunities = async (
  statusFilter?: string,
): Promise<MinimalOpportunity[]> => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      return [];
    }
    const savedOpportunities = await getSavedOpportunities(
      session.token,
      session.user_id,
      statusFilter,
    );
    return savedOpportunities;
  } catch (e) {
    console.error("Error fetching saved opportunities:", e);
    return [];
  }
};
