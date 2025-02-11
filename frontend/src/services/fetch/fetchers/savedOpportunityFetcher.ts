import { userSavedOpportunity } from "src/services/fetch/fetchers/fetchers";
import { savedOpportunity } from "src/types/saved-opportunity/savedOpportunityResponseTypes";

export const handleSavedOpportunity = async (
  type: "DELETE" | "POST",
  token: string,
  user_id: string,
  opportunity_id: number,
) => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const subPath =
    type === "POST"
      ? `${user_id}/saved-opportunities`
      : `${user_id}/saved-opportunities/${opportunity_id}`;

  const body =
    type === "POST"
      ? {
          opportunity_id: String(opportunity_id),
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
  user_id: string,
  opportunity_id: number,
): Promise<savedOpportunity | null> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const subPath = `${user_id}/saved-opportunities`;
  const resp = await userSavedOpportunity("GET")({
    subPath,
    additionalHeaders: ssgToken,
  });
  const json = (await resp.json()) as { data: [] };
  const savedOpportunities = json.data;
  const savedOpportunity = savedOpportunities.find(
    (savedOpportunity: { opportunity_id: number }) =>
      savedOpportunity.opportunity_id === opportunity_id,
  );
  return savedOpportunity ?? null;
};
