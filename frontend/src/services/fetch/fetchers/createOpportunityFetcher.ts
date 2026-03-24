"server-only";

import { JSONRequestBody } from "src/services/fetch/fetcherHelpers";
import { fetchGrantorWithMethod } from "src/services/fetch/fetchers/fetchers";
import { CreateOpportunityRecord } from "src/types/grantor/createOpportunityTypes";

export const createOpportunity = async (
  token: string,
  createOppSchema: JSONRequestBody,
): Promise<CreateOpportunityRecord> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchGrantorWithMethod("POST")({
    subPath: `opportunities`,
    additionalHeaders: ssgToken,
    body: createOppSchema,
  });
  const json = (await response.json()) as { data: CreateOpportunityRecord };
  return json.data;
};
