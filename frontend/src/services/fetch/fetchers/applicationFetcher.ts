import { APIResponse } from "src/types/apiResponseTypes";

import { fetchApplicationWithMethod } from "./fetchers";

interface ApplicationStartResponse extends APIResponse {
  data: {
    application_id: string;
  };
}

// make call from server to API to start an application
export const handleStartApplication = async (
  competitionID: string,
): Promise<ApplicationStartResponse> => {
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `start`,
    body: { competition_id: competitionID },
  });

  return (await response.json()) as ApplicationStartResponse;
};
