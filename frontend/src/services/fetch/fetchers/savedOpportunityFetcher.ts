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
  const subPath = `${userId}/saved-opportunities`;
  const resp = await userSavedOpportunity("GET")({
    subPath,
    additionalHeaders: ssgToken,
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
