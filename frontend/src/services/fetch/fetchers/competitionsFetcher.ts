import { CompetitionsDetailApiResponse } from "src/types/competitionsResponseTypes";

import { fetchCompetition } from "./fetchers";

export const getCompetitionDetails = async (
  id: string,
): Promise<CompetitionsDetailApiResponse> => {
  const response = await fetchCompetition({ subPath: id });
  const responseBody = (await response.json()) as CompetitionsDetailApiResponse;
  return responseBody;
};
