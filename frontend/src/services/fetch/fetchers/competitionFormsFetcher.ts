import { CompetitionFormsApiResponse } from "src/types/competitionFormsResponseTypes";

import { fetchCompetitionForms } from "./fetchers";

export async function updateCompetitionForms({
  competitionId,
  body,
}: any): Promise<CompetitionFormsApiResponse> {
  const response = await fetchCompetitionForms({
    subPath: `${competitionId}/forms`,
    body,
  });

  return (await response.json()) as CompetitionFormsApiResponse;
}
