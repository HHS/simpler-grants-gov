import { getSession } from "src/services/auth/session";
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

export const getSavedOpportunities = async (
  token: string,
  userId: string,
): Promise<SavedOpportunity[]> => {
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
  return json.data;
};

export const getSavedOpportunity = async (
  token: string,
  userId: string,
  opportunityId: number,
): Promise<SavedOpportunity | null> => {
  const savedOpportunities = await getSavedOpportunities(token, userId);
  const savedOpportunity = savedOpportunities.find(
    (savedOpportunity: { opportunity_id: number }) =>
      savedOpportunity.opportunity_id === opportunityId,
  );
  return savedOpportunity ?? null;
};

export const fetchSavedOpportunities = async (): Promise<
  SavedOpportunity[]
> => {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      return [];
    }
    const savedOpportunities = await getSavedOpportunities(
      session.token,
      session.user_id as string,
    );
    return savedOpportunities;
  } catch (e) {
    console.error("Error fetching saved opportunities:", e);
    return [];
  }
};
