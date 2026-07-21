import { CompetitionFormsDetailApiResponse } from "src/types/competitionFormsResponseTypes";

import { fetchCompetitionForms } from "./fetchers";

export const getCompetitionFormDetails = async (
  id: string,
): Promise<CompetitionFormsDetailApiResponse> => {
  const response = await fetchCompetitionForms({ subPath: `${id}/forms` });
  const responseBody =
    (await response.json()) as CompetitionFormsDetailApiResponse;
  return responseBody;
};
