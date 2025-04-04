import { APIResponse } from "src/types/apiResponseTypes";

import { fetchApplication } from "./fetchers";

interface applicationStartResponse extends APIResponse {
  data: {
    application_id: string;
  };
}

// make call from server to API to start an application
export const handleStartApplication = async (
  competitionID: string,
): Promise<applicationStartResponse> => {
  const response = await fetchApplication({
    subPath: `start`,
    body: { competition_id: competitionID },
  });

  return (await response.json()) as applicationStartResponse;
};
