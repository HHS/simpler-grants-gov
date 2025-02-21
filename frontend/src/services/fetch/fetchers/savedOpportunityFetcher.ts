import { userSavedOpportunity } from "src/services/fetch/fetchers/fetchers";
import { SavedOpportunity } from "src/types/saved-opportunity/savedOpportunityResponseTypes";

export const handleSavedOpportunity = async (
  type: "DELETE" | "POST",
  token: string,
  userId: string,
  opportunityId: number,
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
  return userSavedOpportunity(type)({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });
};

export const getSavedOpportunity = async (
  token: string,
  userId: string,
  opportunityId: number,
): Promise<SavedOpportunity | null> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const body = {
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
  const subPath = `${userId}/saved-opportunities/list`;
  const resp = await userSavedOpportunity("POST")({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });
  const json = (await resp.json()) as { data: [] };
  const savedOpportunities = json.data;
  const savedOpportunity = savedOpportunities.find(
    (savedOpportunity: { opportunity_id: number }) =>
      savedOpportunity.opportunity_id === opportunityId,
  );
  return savedOpportunity ?? null;
};
