"server-only";

import { fetchGrantorWithMethod } from "src/services/fetch/fetchers/fetchers";
import { CreateOpportunityRecord } from "src/types/grantor/createOpportunityTypes";

export const handleCreateOpportunity = async (
  type: "POST", // "POST" | "PUT" | "DELETE"
  token: string,
  createOppSchema: CreateOpportunityRecord,
  opportunityId?: string,
): Promise<CreateOpportunityRecord> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const subPath =
    type === "POST" ? `opportunities` : `opportunities/${opportunityId}`; // for select, update and delete

  const body = type === "POST" || type === "PUT" ? createOppSchema : {}; // for select and delete

  const response = await fetchGrantorWithMethod(type)({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });
  const json = (await response.json()) as { data: CreateOpportunityRecord };
  return json.data;
};
