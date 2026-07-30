"server only";

import { CompetitionFormsApiResponse } from "src/types/competitionFormsResponseTypes";
import { CompetitionFormsSubmitApi } from "src/types/competitionsResponseTypes";

import { fetchCompetitionForms } from "./fetchers";

export async function updateCompetitionForms({
  competitionId,
  body,
}: {
  competitionId: string;
  body: { forms: CompetitionFormsSubmitApi[] };
}): Promise<CompetitionFormsApiResponse> {
  const response = await fetchCompetitionForms({
    subPath: `${competitionId}/forms`,
    body,
  });

  return (await response.json()) as CompetitionFormsApiResponse;
}
