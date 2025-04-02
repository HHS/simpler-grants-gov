import { APIResponse } from "src/types/apiResponseTypes";

import { fetchApplications } from "./fetchers";

interface applicationStartResponse extends APIResponse {
  competition_id: string;
}

// make call from server to API to start an application
export const handleStartApplication = async (
  competitionID: string,
): Promise<applicationStartResponse> => {
  const response = await fetchApplications({
    subPath: `start`,
    body: { competition_id: competitionID },
  });

  return (await response.json()) as applicationStartResponse;
};
