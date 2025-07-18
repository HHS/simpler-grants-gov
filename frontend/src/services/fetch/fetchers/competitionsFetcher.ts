import { Competition } from "src/types/competitionsResponseTypes";

import { fetchCompetition } from "./fetchers";

export const getCompetitionDetails = async (
  id: string,
): Promise<Competition> => {
  const response = await fetchCompetition({ subPath: id });
  const responseBody = (await response.json()) as { data: Competition };

  return responseBody.data;
};
